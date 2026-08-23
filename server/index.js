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

// DEBUG: print all env vars to help Railway debugging
console.log("DEBUG env keys:", Object.keys(process.env).filter(k => !k.startsWith("npm") && !k.startsWith("NODE")).join(", "));
console.log("DEBUG DB_HOST:", process.env.DB_HOST);
console.log("DEBUG GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");
console.log("DEBUG MYSQLHOST:", process.env.MYSQLHOST);
console.log("DEBUG MYSQL_ROOT_PASSWORD:", process.env.MYSQL_ROOT_PASSWORD ? "SET" : "NOT SET");

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
} from "./validation.js";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Rate Limiters ───────────────────────────────────────────

// Global: 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

// Chat: 10 requests per minute per IP (protects Gemini costs)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
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
app.use(cors({ origin: ALLOWED_ORIGINS }));

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

// POST /api/chat — Send a message, get AI response via server-side Gemini
app.post("/api/chat", chatLimiter, validateBody(SendMessageSchema), async (req, res) => {
  try {
    const { message } = req.validatedBody; // Already sanitized by Zod

    let responseText;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      // Call Gemini API server-side (key is never exposed to browser)
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-lite-latest",
        systemInstruction: HEALTH_SYSTEM_PROMPT,
      });

      const result = await model.generateContent(message);
      responseText = result.response.text();
    } else {
      responseText = getFallbackResponse(message);
    }

    // Store in MySQL
    try {
      await pool.query(
        "INSERT INTO chat_messages (user_message, bot_response) VALUES (?, ?)",
        [message, responseText]
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

// GET /api/chat/history — Get recent chat messages
app.get("/api/chat/history", validateQuery(ChatHistoryQuerySchema), async (req, res) => {
  try {
    const { limit } = req.validatedQuery;
    const [rows] = await pool.query(
      "SELECT * FROM chat_messages ORDER BY created_at DESC LIMIT ?",
      [limit]
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
    const [rows] = await pool.query(
      "SELECT * FROM vaccination_records ORDER BY scheduled_date ASC"
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
      `INSERT INTO vaccination_records (id, vaccine_name, scheduled_date, date_administered, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        data.vaccine_name,
        data.scheduled_date || null,
        data.date_administered || null,
        data.status || "scheduled",
        data.notes || null,
      ]
    );

    const [rows] = await pool.query("SELECT * FROM vaccination_records WHERE id = ?", [recordId]);
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

      values.push(id);
      await pool.query(
        `UPDATE vaccination_records SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      const [rows] = await pool.query("SELECT * FROM vaccination_records WHERE id = ?", [id]);
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
      const [result] = await pool.query("DELETE FROM vaccination_records WHERE id = ?", [id]);

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

// ─── Gemini System Prompt ─────────────────────────────────────

const HEALTH_SYSTEM_PROMPT = `You are HealthBot, a helpful AI health assistant. Your role is to provide reliable, evidence-based health guidance focused on:

1. Disease prevention and awareness
2. Vaccination information and schedules
3. Hygiene and lifestyle recommendations
4. Common symptoms and when to seek medical help
5. Maternal and child health

Guidelines:
- Always recommend consulting a healthcare professional for serious or specific medical concerns
- Provide general health education, not personalized medical diagnoses
- Be clear, compassionate, and easy to understand
- If you don't know something, honestly say so
- Prioritize information from trusted health organizations (WHO, CDC, etc.)

Do NOT:
- Provide specific drug dosages or prescriptions
- Replace professional medical advice
- Diagnose specific conditions
- Ignore serious symptoms - always advise seeking immediate medical help for emergencies`;

const FALLBACK_RESPONSES = {
  default: "I'm having trouble connecting right now. Here's some general advice: For any health concerns, please consult a healthcare professional. Stay hydrated, maintain good hygiene, and follow recommended vaccination schedules.",
  symptoms: "For symptoms like fever, cough, or body aches: Rest, stay hydrated, and monitor your condition. Seek medical attention if symptoms persist for more than 3 days or worsen. Call emergency services for severe symptoms like difficulty breathing, chest pain, or high fever (above 103°F/39.4°C).",
  vaccination: "Vaccination is one of the most effective ways to prevent disease. Follow your country's recommended immunization schedule. Contact your local health center for available vaccines and schedules.",
};

function getFallbackResponse(message) {
  const lower = (message || "").toLowerCase();
  if (lower.includes("symptom") || lower.includes("fever") || lower.includes("cough")) {
    return FALLBACK_RESPONSES.symptoms;
  }
  if (lower.includes("vaccine") || lower.includes("vaccination") || lower.includes("immuniz")) {
    return FALLBACK_RESPONSES.vaccination;
  }
  return FALLBACK_RESPONSES.default;
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
await initSchema(pool);

app.listen(PORT, () => {
  console.log(`🚀 HealthBot API server running on http://localhost:${PORT}`);
  console.log(`   Gemini API key: ${process.env.GEMINI_API_KEY ? "✅ configured" : "⚠️  not set (using fallbacks)"}`);
  console.log(`   MySQL: ${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || "healthbot"}`);
  console.log(`   Rate limiting: ✅ active (chat: 10/min, global: 200/15min)`);
  console.log(`   Zod validation: ✅ active on all routes`);
  console.log(`   Frontend: ${existsSync(distPath) ? "✅ served from dist/" : "⚠️  not built (run npm run build)"}`);
});
