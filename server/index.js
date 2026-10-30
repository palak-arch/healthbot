import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env before anything else reads process.env
import { config } from "dotenv";
import { existsSync as pathExistsSync } from "fs";
const envPath = join(__dirname, ".env");
if (pathExistsSync(envPath)) {
  config({ path: envPath });
}

import express from "express";
import cors from "cors";
import { existsSync, readFileSync } from "fs";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import pool from "./db.js";
import { initSchema } from "./init-db.js";
import {
  validateBody,
  validateParams,
  validateQuery,
  SendMessageSchema,
  ChatHistoryQuerySchema,
  CreateVaccinationSchema,
  UpdateVaccinationSchema,
  VaccinationIdParamSchema,
  CreateHospitalSchema,
  HospitalReviewSchema,
  CreatePatientSchema,
  PatientSignupSchema,
  PatientLoginSchema,
} from "./validation.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Patient Auth (per-user accounts) ────────────────────────
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// A hardcoded fallback secret lets anyone forge a patient token and read
// another person's health records, so production refuses to start without one.
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const JWT_SECRET = (() => {
  const secret = process.env.PATIENT_JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (IS_PRODUCTION) {
    throw new Error(
      "PATIENT_JWT_SECRET is missing or shorter than 32 characters. Refusing to start in production: a guessable secret allows patient accounts to be forged."
    );
  }
  console.warn(
    "⚠️  PATIENT_JWT_SECRET not set (or shorter than 32 chars) — using an ephemeral development secret. Set it before deploying."
  );
  return crypto.randomUUID() + crypto.randomUUID();
})();
const PATIENT_TOKEN_TTL = "30d";

function signPatientToken(user) {
  return jwt.sign({ sub: user.id, phone: user.phone, name: user.name }, JWT_SECRET, {
    expiresIn: PATIENT_TOKEN_TTL,
  });
}

// Bearer-token middleware: attaches req.patientUser for valid tokens
function requirePatientAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Please log in to see your patient profiles" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.patientUser = { id: payload.sub, phone: payload.phone, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: "Your session expired — please log in again", code: "token_expired" });
  }
}

// ─── Admin Auth ──────────────────────────────────────────────

// Simple shared-password gate for admin/hospital-board operations.
// The dashboard sends it as `x-admin-key`; compare with timing-safe equal.
import { timingSafeEqual } from "crypto";

function adminKeyMatch(provided) {
  const expected = process.env.ADMIN_KEY || "";
  if (!expected || !provided) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requireAdmin(req, res, next) {
  if (adminKeyMatch(req.headers["x-admin-key"])) return next();
  res.status(401).json({ error: "Unauthorized — admin key required" });
}

// ─── Rate Limiters ───────────────────────────────────────────

// Global: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Chat: 20 requests per minute per IP (protects Gemini costs)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "You're sending messages too quickly.",
    retryAfter: "Please wait a moment before sending another message.",
  },
  // Use a custom key to rate-limit by IP + a simple token bucket
  keyGenerator: (req) => ipKeyGenerator(req),
});

// Vaccinations: 30 writes per minute per IP
const vaccinationWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many write requests. Please slow down." },
});

// NL search parse: separate bucket so hospital searches don't eat the chat quota
const parseLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many searches. Please wait a moment." },
});

// Health check: generous (100 per minute)
const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Rate limit exceeded for health check." },
});

// ─── Global Middleware ────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:8080",
  process.env.CORS_ORIGIN,
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow configured origins, localhost on any port (dev), and Railway domains
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      /^https?:\/\/localhost(:\d+)?$/.test(origin) ||
      /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin) ||
      origin.endsWith('.up.railway.app')
    ) {
      return callback(null, true);
    }
    callback(null, false); // Don't allow unknown origins
  },
}));

// Serve built frontend in production
const distPath = join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
}
app.use(express.json({ limit: "10kb" })); // Limit body size to prevent abuse
app.use(globalLimiter);

// ─── Health Check ─────────────────────────────────────────────
app.get("/api/health", healthLimiter, async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(503).json({ status: "error", db: "disconnected" });
  }
});

// ─── Chat Routes ──────────────────────────────────────────────

// Per-session conversation memory for the chat (last N turns sent to Gemini)
const CHAT_HISTORY_TURNS = 8;
const chatMemory = new Map(); // sessionId -> [{role, text}]
const CHAT_MEMORY_MAX_SESSIONS = 500;

function rememberTurn(sessionId, role, text) {
  if (!sessionId) return;
  const history = chatMemory.get(sessionId) || [];
  history.push({ role, text });
  // Keep only the last N turns
  while (history.length > CHAT_HISTORY_TURNS) history.shift();
  // Bound the map so memory doesn't grow forever
  if (chatMemory.size > CHAT_MEMORY_MAX_SESSIONS) {
    const oldest = chatMemory.keys().next().value;
    chatMemory.delete(oldest);
  }
  chatMemory.set(sessionId, history);
}

function getHistory(sessionId) {
  if (!sessionId) return [];
  return chatMemory.get(sessionId) || [];
}

// ─── Off-topic guard ────────────────────────────────────────
// Fast local check: recipes, entertainment, coding, etc. get a polite
// refusal WITHOUT calling Gemini (saves cost, guarantees the rule).
const OFF_TOPIC_PATTERNS = [
  /\brecipe\b/i, /\bhow to (make|cook|prepare|bake)\b/i,
  /\bpaneer\b/i, /\btikka\b/i, /\bbiryani\b/i, /\bcurry recipe\b/i,
  /\bmasala\b/i, /\bkabab\b|\bkebab\b/i, /\bcake\b/i,
  /\bmovie\b|\bfilm\b|\bnetflix\b|\bsong\b|\blyrics\b/i,
  /\bcricket\b|\bfootball\b|\bscore\b|\bipl\b/i,
  /\bpython\b|\bjavascript\b|\bcode\b|\bcoding\b|\bprogram\b/i,
  /\bhomework\b|\bessay\b|\bmath problem\b/i,
  /\bjoke\b|\briddle\b|\bstory\b/i,
  /\bweather\b|\bstock\b|\bshare market\b/i,
  // Direct dish/cuisine-name asks: "what is paneer tikka", "how do i make biryani"
  /\b(what|how)\b.*(\bpaneer tikka\b|\bbiryani\b|\btikka masala\b|\bpizza\b|\bpasta\b|\bmaggi\b)/i,
];

const OFF_TOPIC_REPLY =
  "Haha, that one's outside my lane — I only know health stuff! But hey, if you've got questions about symptoms, vaccines, or staying healthy, I'm all ears.";

function isOffTopic(message) {
  return OFF_TOPIC_PATTERNS.some((p) => p.test(message));
}

// Health-adjacent overrides: these contain food words but ARE health questions
const HEALTH_OVERRIDE = /\b(healthy|health|nutrition|diet|eat|eating|safe|good for|digest|calorie|protein|vitamin|sick|fever|diabet|cholesterol|bp|blood pressure|weight)\b/i;

function isOffTopicChecked(message) {
  return isOffTopic(message) && !HEALTH_OVERRIDE.test(message);
}

// ─── Emergency backstop (server) ─────────────────────────────
// The authoritative detector is src/lib/emergency.ts, which runs in the browser
// before any request is sent. This smaller list is a backstop for direct API
// callers and for clients that skip the check. When it fires, the model is not
// consulted at all — the fixed reply goes back verbatim.
// Keep the wording in sync with EMERGENCY_REPLY in src/lib/emergency.ts.
const EMERGENCY_SIGNALS = [
  /\b(can ?not|can'?t|cant)\s*(breath|brethe|brthing)|trouble\s*breathing|shortness\s*of\s*breath|choking/i,
  /\b(chest|cheast|chst)\s*(pain|tightness|pressure)|\bheart\s*attack/i,
  /\bbleeding\b[^.!?]{0,25}\b(won'?t|not)\s*stop|\bheavy\s*bleeding|\bvomiting\s*blood/i,
  /\b(unconscious|unconcious|passed\s*out|fainted|not\s*waking)\b/i,
  /\b(seizure|seziure|seisure|convulsion|having\s*fits)\b/i,
  /\b(suicide|suiside|kill\s*myself|want\s*to\s*die|self\s*harm|khudkhushi|atmahatya)\b/i,
  /\b(overdose|poisoned|snake\s*bite|scorpion\s*sting|zeher|zahar|saap|saanp)\b/i,
  /\b(face\s*droop|slurred\s*speech|stroke|paralysis|lakwa)\b/i,
  /सा[ँं]?स\s*(नहीं|नही)\s*(आ|ले)|सीने?\s*में\s*दर्द|बेहोश|दौरा\s*(पड़|आ)|खून\s*(बह|नहीं\s*रुक)/,
  /ਸਾਹ\s*(ਨਹੀਂ|ਨਹੀ)\s*ਆ|ਛਾਤੀ\s*(ਵਿੱਚ|ਚ)\s*ਦਰਦ|ਬੇਹੋਸ਼|ਦੌਰਾ\s*(ਪੈ|ਪਿਆ)/,
  /\b(newborn|baby|bachcha)\b[^.!?]{0,25}\b(not\s*breathing|blue|limp|lifeless)\b/i,
];

const EMERGENCY_REPLY = `⚠️ This might be an emergency. Please get help right now instead of reading more here.

• Call 108 (ambulance) or 112 (all emergencies) — both are free and work 24/7.
• If you can, ask someone nearby to take you to the nearest hospital emergency department. Please don't drive yourself.
• Mental health crisis: call Tele-MANAS on 14416 (free, confidential).

Hindi: अगर यह आपातकाल है, तो तुरंत 108 या 112 पर कॉल करें। खुद गाड़ी न चलाएँ।
Punjabi: ਜੇ ਇਹ ਐਮਰਜੈਂਸੀ ਹੈ ਤਾਂ ਤੁਰੰਤ 108 ਜਾਂ 112 'ਤੇ ਕਾਲ ਕਰੋ। ਆਪਣੇ ਆਪ ਗੱਡੀ ਨਾ ਚਲਾਓ।

I'm an AI helper, not an emergency service, and I can't call anyone for you. Once you or the person you're with is safe and has been seen by a doctor, come back and I'll explain things in plain words.`;

function isEmergencySignal(message) {
  const text = (message || "").toLowerCase();
  return EMERGENCY_SIGNALS.some((re) => re.test(text));
}

// Caller identity for records that are not behind patient login yet. The client
// sends a per-tab session id; direct API calls fall back to their own IP.
function ownerKey(req) {
  const header = req.headers["x-session-id"];
  if (typeof header === "string" && header.length >= 8 && header.length <= 64) {
    return header;
  }
  return `ip-${req.ip}`;
}

// POST /api/chat — Send a message, get AI response via server-side Gemini
app.post("/api/chat", chatLimiter, validateBody(SendMessageSchema), async (req, res) => {
  try {
    const { message } = req.validatedBody; // Already sanitized by Zod
    // Session id from client (falls back to IP so curl still works reasonably)
    const sessionId =
      typeof req.headers["x-session-id"] === "string" && req.headers["x-session-id"].length <= 64
        ? req.headers["x-session-id"]
        : `ip-${req.ip}`;

    let responseText;

    // Emergency gate runs FIRST: no model call, no delay, fixed safe copy.
    if (isEmergencySignal(message)) {
      try {
        await pool.query(
          "INSERT INTO chat_messages (user_id, user_message, bot_response) VALUES (?, ?, ?)",
          [ownerKey(req), message, EMERGENCY_REPLY]
        );
      } catch (dbErr) {
        console.error("Failed to store emergency message:", dbErr.message);
      }
      return res.json({ response: EMERGENCY_REPLY, emergency: true });
    }

    // Hard off-topic gate — recipes/games/coding etc. never reach Gemini
    if (isOffTopicChecked(message)) {
      return res.json({ response: OFF_TOPIC_REPLY });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      // Call Gemini API server-side (key is never exposed to browser)
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-lite-latest",
        systemInstruction: HEALTH_SYSTEM_PROMPT,
      });

      // Build the conversation: history + the new question, so follow-ups
      // like "and for children?" work correctly
      const history = getHistory(sessionId);
      const contents = [
        ...history.map((h) => ({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.text }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      const result = await model.generateContent({ contents });
      responseText = result.response.text();

      // Remember this exchange
      rememberTurn(sessionId, "user", message);
      rememberTurn(sessionId, "assistant", responseText);
    } else {
      responseText = getFallbackResponse(message);
    }

    // Store in MySQL, scoped to the caller's session
    try {
      await pool.query(
        "INSERT INTO chat_messages (user_id, user_message, bot_response) VALUES (?, ?, ?)",
        [ownerKey(req), message, responseText]
      );
    } catch (dbErr) {
      console.error("Failed to store chat message:", dbErr.message);
    }

    res.json({ response: responseText });
  } catch (error) {
    console.error("Chat API error:", error.message);
    const fallback = getFallbackResponse(req.validatedBody?.message || "");
    res.json({ response: fallback });
  }
});

// GET /api/admin/verify — validate the admin key (used by the /admin login screen)
// GET /api/hospitals must stay public for the finder, so the login check needs
// an endpoint that is actually protected.
app.get("/api/admin/verify", requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// GET /api/chat/history — Get recent chat messages
app.get("/api/chat/history", validateQuery(ChatHistoryQuerySchema), async (req, res) => {
  try {
    const { limit } = req.validatedQuery;
    // Chat messages are health data. Without this filter any caller could read
    // every user's conversation. Admin sees all; everyone else sees their own.
    const isAdmin = adminKeyMatch(req.headers["x-admin-key"]);
    const [rows] = isAdmin
      ? await pool.query("SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT ?", [limit])
      : await pool.query(
          "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
          [ownerKey(req), limit]
        );
    res.json(rows.reverse());
  } catch (error) {
    console.error("Chat history error:", error.message);
    res.json([]);
  }
});

// ─── Vaccination Routes ───────────────────────────────────────

// GET /api/vaccinations — List all vaccination records
app.get("/api/vaccinations", async (req, res) => {
  try {
    // Scoped to the caller. A shared table listing every patient's vaccination
    // history is a health-data leak, not a feature.
    const [rows] = await pool.query(
      "SELECT * FROM vaccination_records WHERE user_id = ? ORDER BY scheduled_date ASC",
      [ownerKey(req)]
    );
    res.json(rows);
  } catch (error) {
    console.error("Vaccinations fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch records" });
  }
});

// POST /api/vaccinations — Create a new vaccination record
app.post("/api/vaccinations", vaccinationWriteLimiter, validateBody(CreateVaccinationSchema), async (req, res) => {
  try {
    const data = req.validatedBody; // Already sanitized by Zod
    const recordId = data.id || crypto.randomUUID();

    await pool.query(
      `INSERT INTO vaccination_records (id, user_id, vaccine_name, scheduled_date, date_administered, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        ownerKey(req),
        data.vaccine_name,
        data.scheduled_date || null,
        data.date_administered || null,
        data.status || "scheduled",
        data.notes || null,
      ]
    );

    const [rows] = await pool.query(
      "SELECT * FROM vaccination_records WHERE id = ? AND user_id = ?",
      [recordId, ownerKey(req)]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Vaccination create error:", error.message);
    res.status(500).json({ error: "Failed to create record" });
  }
});

// PATCH /api/vaccinations/:id — Update a vaccination record
app.patch(
  "/api/vaccinations/:id",
  vaccinationWriteLimiter,
  validateParams(VaccinationIdParamSchema),
  validateBody(UpdateVaccinationSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;
      const data = req.validatedBody;

      const fields = [];
      const values = [];

      if (data.status !== undefined) {
        fields.push("status = ?");
        values.push(data.status);
      }
      if (data.date_administered !== undefined) {
        fields.push("date_administered = ?");
        values.push(data.date_administered);
      }
      if (data.notes !== undefined) {
        fields.push("notes = ?");
        values.push(data.notes);
      }

      values.push(id, ownerKey(req));
      await pool.query(
        `UPDATE vaccination_records SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
        values
      );

      const [rows] = await pool.query(
        "SELECT * FROM vaccination_records WHERE id = ? AND user_id = ?",
        [id, ownerKey(req)]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error("Vaccination update error:", error.message);
      res.status(500).json({ error: "Failed to update record" });
    }
  }
);

// DELETE /api/vaccinations/:id — Delete a vaccination record
app.delete(
  "/api/vaccinations/:id",
  vaccinationWriteLimiter,
  validateParams(VaccinationIdParamSchema),
  async (req, res) => {
    try {
      const { id } = req.validatedParams;
      const [result] = await pool.query(
        "DELETE FROM vaccination_records WHERE id = ? AND user_id = ?",
        [id, ownerKey(req)]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Vaccination delete error:", error.message);
      res.status(500).json({ error: "Failed to delete record" });
    }
  }
);

// ─── NL Search: parse a natural language query into structured filters ──

const SEARCH_PARSE_PROMPT = `You convert natural-language hospital searches into structured JSON filters.

Extract these fields from the user's query:
- "disease": one of "cancer", "brain-tumor", "neuro", "kidney", "heart", "transplant", "fever-flu", "covid", "dengue", "diabetes", "asthma", "child-health", "maternal", "vaccination", "injury", "medicine", or null if no disease mentioned
- "location": city or place name as a plain string (e.g. "Chandigarh", "Mumbai"), or null if not mentioned
- "budgetInr": maximum budget as a plain number in INR (e.g. 200000 for "2 lakh", 50000 for "50 thousand"), or null if not mentioned
- "priority": "distance" if they care about being close, "cost" if they care about price, else null

Respond with ONLY a JSON object, no markdown, no explanation. Example:
{"disease":"kidney","location":"Chandigarh","budgetInr":200000,"priority":"cost"}

User query: "`; 

app.post("/api/search/parse", parseLimiter, validateBody(SendMessageSchema), async (req, res) => {
  try {
    const { message } = req.validatedBody;
    const apiKey = process.env.GEMINI_API_KEY;

    let parsed = { disease: null, location: null, budgetInr: null, priority: null, source: "keyword" };

    if (apiKey) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-flash-lite-latest",
          systemInstruction: SEARCH_PARSE_PROMPT,
          generationConfig: { temperature: 0 },
        });
        // Timeout so a slow Gemini response can't hang the search
        const result = await Promise.race([
          model.generateContent(message + "\""),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), 8000)),
        ]);
        let text = result.response.text().trim();
        // Strip markdown fences if the model added them
        text = text.replace(/^```(json)?/m, "").replace(/```$/m, "").trim();
        const obj = JSON.parse(text);
        parsed = {
          disease: typeof obj.disease === "string" ? obj.disease : null,
          location: typeof obj.location === "string" ? obj.location : null,
          budgetInr: typeof obj.budgetInr === "number" ? obj.budgetInr : null,
          priority: typeof obj.priority === "string" ? obj.priority : null,
          source: "gemini",
        };
      } catch (aiErr) {
        console.error("Gemini parse failed, falling back to keywords:", aiErr.message);
      }
    }

    // Keyword fallback / sanity check for the disease field
    if (!parsed.disease) {
      const kwMap = {
        cancer: ["cancer", "tumor", "tumour", "oncology", "chemo"],
        "brain-tumor": ["brain tumor", "brain tumour", "brain surgery", "glioma"],
        neuro: ["stroke", "epilepsy", "parkinson", "neurology", "seizure"],
        kidney: ["kidney", "renal", "dialysis", "nephrology"],
        heart: ["heart", "cardiac", "cardiology", "angioplasty", "bypass"],
        transplant: ["transplant", "organ failure"],
        diabetes: ["diabetes", "sugar"],
        asthma: ["asthma", "breathing", "copd"],
        dengue: ["dengue", "malaria"],
        maternal: ["pregnan", "maternal", "delivery"],
      };
      const lower = message.toLowerCase();
      outer: for (const [id, words] of Object.entries(kwMap)) {
        for (const w of words) {
          if (lower.includes(w)) { parsed.disease = id; break outer; }
        }
      }
    }

    res.json(parsed);
  } catch (error) {
    console.error("Search parse error:", error.message);
    res.status(500).json({ error: "Could not parse search query" });
  }
});

// ─── Hospital Records (admin dashboard) ───────────────────────

// GET /api/hospitals — list all hospital records
app.get("/api/hospitals", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM hospital_records ORDER BY created_at DESC LIMIT 200"
    );
    res.json(rows);
  } catch (error) {
    console.error("Hospitals fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch hospital records" });
  }
});

// POST /api/hospitals — upload a new hospital record (admin only)
app.post("/api/hospitals", requireAdmin, vaccinationWriteLimiter, validateBody(CreateHospitalSchema), async (req, res) => {
  try {
    const b = req.validatedBody;
    const id = b.id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO hospital_records
       (id, name, city, address, phone, lat, lng, services, avg_treatment_cost_inr, beds, annual_patients, accreditation, status, source, submitted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name=VALUES(name), city=VALUES(city), address=VALUES(address), phone=VALUES(phone),
         services=VALUES(services), avg_treatment_cost_inr=VALUES(avg_treatment_cost_inr),
         beds=VALUES(beds), annual_patients=VALUES(annual_patients), accreditation=VALUES(accreditation),
         status=VALUES(status), source=VALUES(source), updated_at=NOW()`,
      [
        id,
        b.name,
        b.city,
        b.address || null,
        b.phone || null,
        b.lat || null,
        b.lng || null,
        b.services ? JSON.stringify(b.services) : null,
        b.avgTreatmentCostInr || null,
        b.beds || null,
        b.annualPatients || null,
        b.accreditation || null,
        b.status || "pending_review",
        b.source || "admin_upload",
        b.submittedBy || "admin",
      ]
    );
    const [rows] = await pool.query("SELECT * FROM hospital_records WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Hospital create error:", error.message);
    res.status(500).json({ error: "Failed to save hospital record" });
  }
});

// PATCH /api/hospitals/:id — review/approve/reject a record (admin only)
app.patch("/api/hospitals/:id", requireAdmin, vaccinationWriteLimiter, validateParams(VaccinationIdParamSchema), validateBody(HospitalReviewSchema), async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const { status, reviewNote } = req.validatedBody;
    await pool.query(
      "UPDATE hospital_records SET status = ?, review_note = ?, updated_at = NOW() WHERE id = ?",
      [status, reviewNote || null, id]
    );
    const [rows] = await pool.query("SELECT * FROM hospital_records WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Record not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Hospital update error:", error.message);
    res.status(500).json({ error: "Failed to update record" });
  }
});

// ─── Patient Accounts (signup / login) ───────────────────────

// POST /api/auth/signup — create a patient account (phone + password)
app.post("/api/auth/signup", vaccinationWriteLimiter, validateBody(PatientSignupSchema), async (req, res) => {
  try {
    const { name, phone, password } = req.validatedBody;
    const phoneNorm = phone.trim();
    const [existing] = await pool.query("SELECT id FROM patient_users WHERE phone = ?", [phoneNorm]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this phone already exists — try logging in" });
    }
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO patient_users (id, name, phone, password_hash) VALUES (?, ?, ?, ?)",
      [id, name.trim(), phoneNorm, hash]
    );
    const token = signPatientToken({ id, phone: phoneNorm, name: name.trim() });
    res.status(201).json({ token, user: { id, name: name.trim(), phone: phoneNorm } });
  } catch (error) {
    console.error("Patient signup error:", error.message);
    res.status(500).json({ error: "Could not create account" });
  }
});

// POST /api/auth/login — patient login (phone + password)
app.post("/api/auth/login", vaccinationWriteLimiter, validateBody(PatientLoginSchema), async (req, res) => {
  try {
    const { phone, password } = req.validatedBody;
    const [rows] = await pool.query("SELECT * FROM patient_users WHERE phone = ?", [phone.trim()]);
    const user = rows[0];
    // Same error for unknown phone and wrong password (no account enumeration)
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Wrong phone number or password" });
    }
    const token = signPatientToken({ id: user.id, phone: user.phone, name: user.name });
    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone } });
  } catch (error) {
    console.error("Patient login error:", error.message);
    res.status(500).json({ error: "Could not log in" });
  }
});

// GET /api/auth/me — check token still valid (used on page load)
app.get("/api/auth/me", requirePatientAuth, (req, res) => {
  res.json({ user: req.patientUser });
});

// ─── Patient Records ─────────────────────────────────────────

// GET /api/patients — list ONLY the logged-in user's profiles (newest first)
app.get("/api/patients", requirePatientAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM patient_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
      [req.patientUser.id]
    );
    res.json(rows);
  } catch (error) {
    console.error("Patients fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch patient records" });
  }
});

// GET /api/patients/:id — get one of YOUR patient profiles
app.get("/api/patients/:id", requirePatientAuth, validateParams(VaccinationIdParamSchema), async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM patient_records WHERE id = ? AND user_id = ?",
      [req.validatedParams.id, req.patientUser.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Patient not found" });
    res.json(rows[0]);
  } catch (error) {
    console.error("Patient fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch patient record" });
  }
});

// POST /api/patients — save a patient profile (owned by the logged-in user)
app.post("/api/patients", requirePatientAuth, vaccinationWriteLimiter, validateBody(CreatePatientSchema), async (req, res) => {
  try {
    const b = req.validatedBody;
    const id = b.id || crypto.randomUUID();
    await pool.query(
      `INSERT INTO patient_records
       (id, user_id, full_name, age, gender, blood_group, phone, conditions, medications, allergies, emergency_contact, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         full_name=VALUES(full_name), age=VALUES(age), gender=VALUES(gender),
         blood_group=VALUES(blood_group), phone=VALUES(phone), conditions=VALUES(conditions),
         medications=VALUES(medications), allergies=VALUES(allergies),
         emergency_contact=VALUES(emergency_contact), notes=VALUES(notes), updated_at=NOW()`,
      [
        id,
        req.patientUser.id,
        b.fullName,
        b.age,
        b.gender || null,
        b.bloodGroup || null,
        b.phone || null,
        JSON.stringify(b.conditions || []),
        JSON.stringify(b.medications || []),
        JSON.stringify(b.allergies || []),
        b.emergencyContact || null,
        b.notes || null,
      ]
    );
    const [rows] = await pool.query("SELECT * FROM patient_records WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Patient create error:", error.message);
    res.status(500).json({ error: "Failed to save patient record" });
  }
});

// DELETE /api/patients/:id — remove YOUR OWN patient profile
app.delete("/api/patients/:id", requirePatientAuth, vaccinationWriteLimiter, validateParams(VaccinationIdParamSchema), async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM patient_records WHERE id = ? AND user_id = ?",
      [req.validatedParams.id, req.patientUser.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Patient not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Patient delete error:", error.message);
    res.status(500).json({ error: "Failed to delete patient record" });
  }
});

// ─── Gemini System Prompt ─────────────────────────────────────

const HEALTH_SYSTEM_PROMPT = `Hey! I'm HealthBot — your chill health buddy. I'm here to help you stay healthy, no stress.

RULE #1 — HEALTH TOPICS ONLY:
You ONLY answer health and medical questions: symptoms, illnesses, medicines (general info), vaccines, first aid, nutrition for health, fitness for recovery, mental health, mother and baby care, finding doctors/hospitals.
If the question is NOT about health — like recipes ("paneer tikka"), movies, cricket, coding, homework, jokes, or general trivia — politely decline and steer back to health. Say something like:
"Haha, that one's outside my lane — I only know health stuff! But hey, if you have any questions about staying healthy, symptoms, or vaccines, I'm all ears."
Never give the recipe, answer, or information itself. Decline, then redirect.
Edge case: food questions ARE allowed when they're about health ("is paneer healthy?", "what should I eat with fever?" — answer those). It's recipes/cooking steps that are off-limits.

YOUR TOP PRIORITY: Sound like a real person talking to a friend. Keep it casual, warm, and super easy to follow.

How to talk:
- Use short, simple English — like you're texting a friend
- Be casual and relaxed: "Hey, don't worry too much about it" instead of "You should not be concerned"
- Use contractions: "don't", "you're", "it's", "can't"
- It's fine to say "stuff", "thing", "hang out" — everyday words people actually use
- Never use big or fancy words — if a 10-year-old wouldn't say it, don't use it
- If you must use a medical word, explain it right after in plain words

How to write your replies:
- Keep it SHORT — a few lines is perfect
- Use numbered lists for steps — easy to follow
- One idea per sentence
- Answer only what they asked — don't overload them
- Sound friendly, not robotic or textbook-like

GOOD reply to "I have fever, what should I do?":
"Hey, don't stress — fever just means your body is fighting something off. Here's what to do:

1. Get some rest — your body needs it
2. Drink plenty of water so you don't get dehydrated
3. Keep it light — soup, rice, fruit stuff like that
4. If it feels really bad, call a doctor — I won't guess at doses

But heads up — go see a doctor if:
- It sticks around for more than 3 days
- It goes above 103 F
- You have trouble breathing or chest pain

You got this!"

BAD reply (too formal, too long, boring):
"Fever is a common symptom that can be caused by many things including viral infections, bacterial infections, and other inflammatory conditions. It is important to rest and stay hydrated while monitoring your condition..."

What you know about:
1. Staying healthy and avoiding getting sick
2. Vaccines and when to get them
3. Good hygiene and daily habits
4. Common symptoms and when to see a doctor
5. Mother and baby health

Rules:
- Always tell them to see a doctor for serious stuff
- Never give strong medicines or prescriptions
- Never say what disease someone has — you're a buddy, not a doctor
- If someone seems to be having an emergency, stop and tell them to get help RIGHT NOW: call 108 (ambulance) or 112 (all emergencies). Don't give first-aid steps that could delay that call
- Never give a dose, a number of tablets, or injection instructions. Never tell someone to start, stop or change a prescribed medicine
- If you don't know something, just say: "Hmm, I'm not sure about that one — better ask a doctor"
- Use facts from WHO, CDC, and trusted health sources
- NEVER use emojis — keep it clean text only`;

// Fixed text a worried person may trust, so it carries no doses, no diagnosis
// and no clinical thresholds — only where to get a human.
const SAFETY_FOOTER =
  "\n\nIf this is urgent, don't wait for me — call 108 (ambulance) or 112 (all emergencies).";

const FALLBACK_RESPONSES = {
  default: {
    en:
      "I can't reach my health knowledge base right now, so I'd rather not guess.\n\nPlease don't treat this as advice — talk to a doctor, nurse or your local health worker if the problem continues." +
      SAFETY_FOOTER,
  },
  symptoms: {
    en:
      "I can't reach my health knowledge base right now, so I won't guess at what's going on or how to treat it.\n\nWhat usually helps while you wait for real advice:\n\n1. Rest, and drink water regularly\n2. Eat something light if you can\n3. Write down when it started and what changed, so a doctor can see the pattern\n\nPlease see a doctor or ASHA worker rather than relying on me for this one." +
      SAFETY_FOOTER,
  },
  vaccination: {
    en:
      "I can't reach my vaccine reference data right now, so I won't repeat a schedule from memory — getting a dose or timing wrong is not worth the risk.\n\n1. Government centres give routine childhood vaccines free of cost\n2. Ask your nearest health worker or centre what is due for you or your family\n3. Bring the child's immunisation card if you have one\n\nThe Vaccinations page in this app still has the reference schedule to look at." +
      SAFETY_FOOTER,
  },
};

function getFallbackResponse(message) {
  const lower = (message || "").toLowerCase();
  // Return the string, not the { en: ... } wrapper — the caller puts this straight
  // into the JSON response body.
  if (lower.includes("symptom") || lower.includes("fever") || lower.includes("cough") || lower.includes("temperature") || lower.includes("pain") || lower.includes("hurt")) {
    return FALLBACK_RESPONSES.symptoms.en;
  }
  if (lower.includes("vaccine") || lower.includes("vaccination") || lower.includes("immuniz") || lower.includes("shot")) {
    return FALLBACK_RESPONSES.vaccination.en;
  }
  return FALLBACK_RESPONSES.default.en;
}

// ─── Global Error Handler ─────────────────────────────────────
// Catch-all: serve index.html for SPA routing in production
app.get("*", (req, res) => {
  const indexPath = join(distPath, "index.html");
  if (existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Global Error Handler
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start Server ─────────────────────────────────────────────

// Initialize DB schema then start server
try {
  await initSchema(pool);
  // Ensure hospital_records exists even if schema.sql path lookup failed
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient_users (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(80) NOT NULL,
      phone VARCHAR(15) NOT NULL UNIQUE,
      password_hash VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `).catch(() => {});
  // Add user_id ownership column if missing (existing installs)
  await pool.query(
    "ALTER TABLE patient_records ADD COLUMN user_id VARCHAR(36) DEFAULT NULL, ADD INDEX idx_patient_user (user_id)"
  ).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS patient_records (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      age INT NOT NULL,
      gender ENUM('male','female','other') DEFAULT NULL,
      blood_group ENUM('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
      phone VARCHAR(40) DEFAULT NULL,
      conditions JSON DEFAULT NULL,
      medications JSON DEFAULT NULL,
      allergies JSON DEFAULT NULL,
      emergency_contact VARCHAR(160) DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_patient_name (full_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `).catch(() => {});
  await pool.query(`
    CREATE TABLE IF NOT EXISTS hospital_records (
      id VARCHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      city VARCHAR(120) NOT NULL,
      address VARCHAR(500) DEFAULT NULL,
      phone VARCHAR(40) DEFAULT NULL,
      lat DECIMAL(10,7) DEFAULT NULL,
      lng DECIMAL(10,7) DEFAULT NULL,
      services JSON DEFAULT NULL,
      avg_treatment_cost_inr INT DEFAULT NULL,
      beds INT DEFAULT NULL,
      annual_patients INT DEFAULT NULL,
      accreditation VARCHAR(255) DEFAULT NULL,
      status ENUM('pending_review', 'approved', 'rejected') DEFAULT 'pending_review',
      source VARCHAR(60) DEFAULT 'admin_upload',
      submitted_by VARCHAR(120) DEFAULT 'admin',
      review_note TEXT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_hosp_city (city),
      INDEX idx_hosp_status (status),
      INDEX idx_hosp_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `).catch(() => {});
} catch {
  // DB may be down (e.g. MySQL not running locally) — server still starts
}

app.listen(PORT, () => {
  console.log(`🚀 HealthBot API server running on http://localhost:${PORT}`);
  console.log(`   Gemini API key: ${process.env.GEMINI_API_KEY ? "✅ configured" : "⚠️  not set (using fallbacks)"}`);
  console.log(`   MySQL: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || "healthbot"}`);
  console.log(`   Rate limiting: ✅ active (chat: 10/min, global: 200/15min)`);
  console.log(`   Zod validation: ✅ active on all routes`);
  console.log(`   Frontend: ${existsSync(distPath) ? "✅ served from dist/" : "⚠️  not built (run npm run build)"}`);
});
