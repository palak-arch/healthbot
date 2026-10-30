/**
 * Emergency safety layer.
 *
 * This is deliberately biased toward false positives: a spurious emergency
 * banner is annoying, a missed emergency can kill someone. It matches English,
 * Hindi (Devanagari), Punjabi (Gurmukhi) and romanised Hinglish/Punjabi, and
 * tolerates common typos.
 *
 * It is NOT the only safety net. The chat always shows emergency numbers as a
 * fixed element, and the server repeats the check so a client bypass still
 * warns the user.
 */

export type EmergencyCategory =
  | "breathing"
  | "cardiac"
  | "bleeding"
  | "consciousness"
  | "stroke"
  | "pregnancy"
  | "newborn"
  | "seizure"
  | "poisoning"
  | "self_harm"
  | "severe_injury"
  | "allergic";

export interface EmergencyContact {
  label: string;
  labelHi: string;
  labelPa: string;
  number: string;
  note: string;
}

/**
 * India-wide numbers. These are fixed constants, never model output, and are
 * rendered on the chat screen at all times so a user in distress does not need
 * a keyword to match before seeing help.
 */
export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  {
    label: "Ambulance",
    labelHi: "एम्बुलेंस",
    labelPa: "ਐਂਬੂਲੈਂਸ",
    number: "108",
    note: "Free 24/7 emergency ambulance (India)",
  },
  {
    label: "All emergencies",
    labelHi: "सभी आपातकाल",
    labelPa: "ਸਾਰੇ ਐਮਰਜੈਂਸੀ",
    number: "112",
    note: "Single number for police, fire and ambulance (India)",
  },
  {
    label: "Health helpline",
    labelHi: "स्वास्थ्य हेल्पलाइन",
    labelPa: "ਸਿਹਤ ਹੈਲਪਲਾਈਨ",
    number: "104",
    note: "Free health advice, 24/7",
  },
  {
    label: "Mental health support",
    labelHi: "मानसिक स्वास्थ्य सहायता",
    labelPa: "ਮਾਨਸਿਕ ਸਿਹਤ ਸਹਾਇਤਾ",
    number: "14416",
    note: "Tele-MANAS — free, confidential counselling",
  },
  {
    label: "Child helpline",
    labelHi: "चाइल्ड हेल्पलाइन",
    labelPa: "ਚਾਈਲਡ ਹੈਲਪਲਾਈਨ",
    number: "1098",
    note: "Child safety and rescue",
  },
  {
    label: "Women's helpline",
    labelHi: "महिला हेल्पलाइन",
    labelPa: "ਮਹਿਲਾ ਹੈਲਪਲਾਈਨ",
    number: "181",
    note: "Women in distress",
  },
];

export interface EmergencyMatch {
  category: EmergencyCategory;
  /** The text fragment that triggered the match, for logging/testing only. */
  matched: string;
}

/** English words that are dangerous even when misspelled. */
const CRITICAL_WORDS: Record<string, EmergencyCategory> = {
  breathing: "breathing",
  breathless: "breathing",
  suffocating: "breathing",
  choking: "breathing",
  bleeding: "bleeding",
  haemorrhage: "bleeding",
  hemorrhage: "bleeding",
  unconscious: "consciousness",
  unresponsive: "consciousness",
  seizure: "seizure",
  convulsion: "seizure",
  suicide: "self_harm",
  overdosed: "poisoning",
  poison: "poisoning",
  stroke: "stroke",
  anaphylaxis: "allergic",
};

interface PatternRule {
  category: EmergencyCategory;
  re: RegExp;
}

/**
 * Phrase rules. Written out per language rather than translated word by word,
 * because the phrasings people actually use are idiomatic.
 */
const PHRASE_RULES: PatternRule[] = [
  // ── English ────────────────────────────────────────────────
  { category: "cardiac", re: /\b(chest|cheast|chst)\s*(pain|paining|hurts?|tight|tightness|pressure|heavy|squeez)/i },
  { category: "cardiac", re: /\bheart\s*attack|\bcardiac\s*arrest|\bheart\s*is\s*stopping/i },
  { category: "cardiac", re: /\bpain\b[^.!?]{0,20}\b(left|right)\s*arm\b/i },
  { category: "breathing", re: /\b(can\s*not|can't|cant|cannot)\s*(breath|brethe|breathd|breathe)\b/i },
  { category: "breathing", re: /\b(difficulty|difficult|trouble|problem|hard)\s*(in\s*)?(breathing|breath|breathe|brthing)/i },
  { category: "breathing", re: /\b(short|shortness)\s*of\s*(breath|breathd)|\bgasping\b|\bblue\s*lips\b/i },
  { category: "breathing", re: /\b(throat|airway)\s*(is\s*)?(closing|swelling|swollen|blocked)|can'?t\s*swallow/i },
  { category: "consciousness", re: /\b(passed\s*out|fainted|fainting|unconcious|unconsious|unconscious|not\s*waking|won'?t\s*wake|unresponsive)\b/i },
  { category: "bleeding", re: /\b(bleading|bleeding)\b[^.!?]{0,25}\b(won'?t|not|doesn'?t|didn'?t)\s*stop|\bheavy\s*(bleading|bleeding)\b|\bblood\s*loss\b/i },
  { category: "bleeding", re: /\b(coughing|vomiting|throwing\s*up)\s*(up\s*)?blood\b|\bblood\s*in\s*(vomit|stool|urine)\b/i },
  { category: "stroke", re: /\b(slurred|slurring)\s*speech|\bface\s*(is\s*)?(droop|drooping|drooped|paralys)/i },
  { category: "stroke", re: /\b(sudden|can'?t|cannot|can\s*not)\s*(move|feel)\s*(my\s*)?(arm|leg|side|face)|\bweakness\s*on\s*one\s*side\b|\bparalys(is|ed)\b/i },
  { category: "seizure", re: /\b(seizure|seziure|seisure|convuls\w*|having\s*fits?|fits?\s*attack)\b/i },
  { category: "poisoning", re: /\b(swallowed|drank|ate|took)\b[^.!?]{0,20}\b(poison|pesticide|kerosene|acid|bleach|tablets?|pills?)\b[^.!?]{0,20}\b(too\s*many|whole|entire|bottle|handful)\b/i },
  { category: "poisoning", re: /\b(swallowed|drank|ate|took)\b[^.!?]{0,30}\b(whole|entire|handful|too\s*many)\b[^.!?]{0,30}\b(bottle|packet|strip|blister|tablets?|pills?)\b/i },
  { category: "poisoning", re: /\b(swallowed|drank|ate|took)\b[^.!?]{0,30}\b(bottle|packet|strip|blister)\b[^.!?]{0,20}\b(tablets?|pills?|medicine)\b/i },
  { category: "poisoning", re: /\bover\s*dose|\boverdosed|\bpoisoned\b|\bsnake\s*bite\b|\bscorpion\s*sting\b/i },
  { category: "self_harm", re: /\b(kill|hurt|harm)\s*(my\s*self|myself|me)\b|\bend\s*(my|it)\s*(life|all)\b|\bwant\s*to\s*die\b|\bdont\s*want\s*to\s*live\b|\bdon'?t\s*want\s*to\s*live\b|\bself\s*harm\b/i },
  { category: "severe_injury", re: /\b(burn|burnt|burned|scald\w*)\b[^.!?]{0,20}\b(badly|severe|face|eyes?|large|all\s*over)\b/i },
  { category: "severe_injury", re: /\b(head|brain)\s*(injury|hit|trauma)\b[^.!?]{0,25}\b(unconscious|vomit\w*|bleed\w*|confus\w*)\b/i },
  { category: "severe_injury", re: /\b(road|car|bike|motorcycle|truck)\s*accident|\baccident\b[^.!?]{0,20}\b(bleed\w*|unconscious|stuck)\b/i },
  { category: "severe_injury", re: /\b(drowning|drowned|electric\s*shock|electrocuted)\b/i },
  { category: "allergic", re: /\b(anaphyla\w*|allergic\s*reaction)\b[^.!?]{0,25}\b(face|throat|tongue|lips|breath\w*|swell\w*)\b/i },
  { category: "newborn", re: /\b(baby|newborn|infant|bachcha|bacha)\b[^.!?]{0,25}\b(not\s*(breathing|crying|feeding|waking)|blue|lifeless|limp)\b/i },
  { category: "newborn", re: /\bnewborn\b[^.!?]{0,25}\b(fever|very\s*hot|convuls\w*|jaundice)\b/i },
  { category: "pregnancy", re: /\b(pregnan\w*|garbh\w*|expecting\s*a\s*baby)\b[^.!?]{0,30}\b(heavy\s*bleed\w*|severe\s*(pain|headache)|baby\s*(is\s*)?(not|stopped)\s*mov\w*|no\s*movement|fits?|convuls\w*|water\s*broke|blurred\s*vision)\b/i },
  { category: "pregnancy", re: /\b(bleeding|severe\s*pain)\b[^.!?]{0,25}\b(pregnan\w*)\b/i },
  { category: "pregnancy", re: /\b(pregnan\w*|garbh\w*)\b[^.!?]{0,30}\b(bleeding|heavy\s*bleeding|severe\s*pain|severe\s*headache|fits?|convuls\w*)\b/i },

  // ── Hindi (Devanagari) ─────────────────────────────────────
  { category: "cardiac", re: /सीने?\s*में\s*(दर्द|दरद|भारीपन|जकड़)/ },
  { category: "cardiac", re: /दिल\s*का\s*(दौरा|दौरा\s*पड़)|हार्ट\s*अटैक/ },
  { category: "breathing", re: /सा[ँं]?स\s*(नहीं|नही)\s*(आ|ले)|सा[ँं]?स\s*(लेने|लेना)\s*में\s*(दिक़्क़त|दिक्कत|तकलीफ|परेशानी)|दम\s*घुट/ },
  { category: "consciousness", re: /बेहोश|होश\s*(नहीं|नही)|होश\s*में\s*नहीं/ },
  { category: "bleeding", re: /खून\s*(बह|नहीं\s*रुक|नही\s*रुक)|बहुत\s*खून|खून\s*की\s*उल्टी/ },
  { category: "newborn", re: /बच्चा\s*सा[ँं]?स\s*(नहीं|नही)\s*ले|नवजात[^।]{0,15}बुखार/ },
  { category: "seizure", re: /दौरा\s*(पड़|आ)|मिर्गी|झटके\s*आ/ },
  { category: "poisoning", re: /ज़ह?र\s*(खा|पी|लिया)|सां?प\s*ने\s*काट|बिच्छू\s*ने\s*काट/ },
  { category: "self_harm", re: /आत्महत्या|खुदकुशी|मरना\s*चाहता|मरना\s*चाहती|जीना\s*नहीं\s*चाहता/ },
  { category: "stroke", re: /लकवा|बोली\s*(नहीं|नही)\s*(आ|निकल)|मुंह\s*टेढ़ा/ },
  { category: "severe_injury", re: /जल\s*(गया|गई|गए)|सड़क\s*दुर्घटना|एक्सीडेंट\s*हो\s*गया/ },
  { category: "pregnancy", re: /गर्भ(वती)?[^।]{0,20}(खून\s*बह|तेज\s*दर्द|तेज़\s*दर्द|बच्चा\s*(नहीं|नही)\s*हिल)/ },

  // ── Punjabi (Gurmukhi) ─────────────────────────────────────
  { category: "cardiac", re: /ਛਾਤੀ\s*(ਵਿੱਚ|ਚ)\s*(ਦਰਦ|ਭਾਰੀਪਣ)|ਦਿਲ\s*ਦਾ\s*ਦੌਰਾ/ },
  { category: "breathing", re: /ਸਾਹ\s*(ਨਹੀਂ|ਨਹੀ)\s*ਆ|ਸਾਹ\s*ਲੈਣ\s*(ਵਿੱਚ|ਚ)\s*(ਤਕਲੀਫ|ਦਿੱਕਤ)|ਦਮ\s*ਘੁਟ/ },
  { category: "consciousness", re: /ਬੇਹੋਸ਼|ਹੋਸ਼\s*(ਨਹੀਂ|ਨਹੀ)/ },
  { category: "bleeding", re: /ਖੂਨ\s*(ਵਹਿ|ਨਹੀਂ\s*ਰੁਕ|ਨਹੀ\s*ਰੁਕ)|ਬਹੁਤ\s*ਖੂਨ/ },
  { category: "seizure", re: /ਦੌਰਾ\s*(ਪੈ|ਪਿਆ|ਆ)|ਮਿਰਗੀ/ },
  { category: "poisoning", re: /ਜ਼ਹਿਰ|ਜਹਿਰ\s*(ਖਾ|ਪੀ)|ਸੱਪ\s*ਨੇ\s*ਕੱਟ|ਬਿੱਛੂ\s*ਨੇ\s*ਕੱਟ/ },
  { category: "self_harm", re: /ਖੁਦਕੁਸ਼ੀ|ਆਤਮਹੱਤਿਆ|ਮਰਨਾ\s*ਚਾਹੁੰਦਾ|ਜੀਣਾ\s*ਨਹੀਂ\s*ਚਾਹੁੰਦਾ/ },
  { category: "stroke", re: /ਲਕਵਾ|ਬੋਲੀ\s*(ਨਹੀਂ|ਨਹੀ)\s*ਨਿਕਲ|ਮੂੰਹ\s*ਟੇਢਾ/ },
  { category: "severe_injury", re: /ਸੜ\s*(ਗਿਆ|ਗਈ|ਗਏ)|ਸੜਕ\s*ਹਾਦਸਾ|ਐਕਸੀਡੈਂਟ\s*ਹੋ\s*ਗਿਆ/ },
  { category: "pregnancy", re: /ਗਰਭ(ਵਤੀ)?[^।]{0,20}(ਖੂਨ\s*ਵਹਿ|ਤੇਜ਼\s*ਦਰਦ|ਬੱਚਾ\s*(ਨਹੀਂ|ਨਹੀ)\s*ਹਿਲ)/ },
  { category: "newborn", re: /ਬੱਚਾ\s*ਸਾਹ\s*(ਨਹੀਂ|ਨਹੀ)\s*ਲੈ|ਨਵਜਾਤ[^।]{0,15}ਬੁਖਾਰ/ },

  // ── Romanised Hindi / Punjabi (Hinglish) ───────────────────
  { category: "cardiac", re: /\b(seene|sine|chhati|chati|chest)\s*(mein|me|mai|vich|vich)\s*(dard|darad|pain)\b/i },
  { category: "cardiac", re: /\bdil\s*(ka|da)\s*(daura|doura)\b|\bheart\s*attack\b/i },
  { category: "breathing", re: /\bsaans?\b[^.!?]{0,15}\b(nahi|nahin|ne|ni)\s*(aa|a)\s*rah/i },
  { category: "breathing", re: /\bsaans?\s*(lene|lena)\s*(mein|me|vich)\s*(dikkat|dikat|takleef|taklif|mushkil)\b/i },
  { category: "breathing", re: /\bdam\s*(ghut|ghutan)|\bghutan\b/i },
  { category: "consciousness", re: /\bbehosh|behoshi|hosh\s*(nahi|nahin|ne)\b/i },
  { category: "bleeding", re: /\bkhoon\s*(bahut|bohot|bah|ruk|nahi\s*ruk)|\bbahut\s*khoon\b/i },
  { category: "seizure", re: /\bmirgi\b|\bdaura\s*(pada|para|aa)\b|\bfits?\s*(aa|ho)\s*rah/i },
  { category: "poisoning", re: /\b(zeher|zahar|jahar)\s*(kha|pi|liya)|\b(saanp|saap)\b\s*(ne)?\s*kat|\bkutte\s*(ne)?\s*kat\b/i },
  { category: "self_harm", re: /\b(khudkhushi|khudkushi|atmahatya)\b|\bmarna\s*chaht|\bjeena\s*(nahi|nahin)\s*chaht/i },
  { category: "stroke", re: /\blakwa\b|\bboli\s*(nahi|nahin)\s*(aa|nikal)\b/i },
  { category: "severe_injury", re: /\bjal\s*(gaya|gayi|gaye)\b|\bsadak\s*durghatna\b|\baccident\s*ho\s*gaya\b/i },
  { category: "pregnancy", re: /\bgarbh\w*\b[^.!?]{0,25}\b(khoon|khoon\s*bah|tez\s*dard|bachcha\s*(nahi|nahin)\s*hil)/i },
  { category: "newborn", re: /\bbachcha\b[^.!?]{0,20}\bsaans?\s*(nahi|nahin)\s*le|\bnavjaat\b[^.!?]{0,15}\bbukhar\b/i },
  { category: "newborn", re: /\b(baby|bachcha|bacha)\b[^.!?]{0,20}\b(doodh|feed)\s*(nahi|nahin)\s*(pi|le)\s*rah/i },
];

/** Collapse whitespace and strip punctuation so spacing/typos around words matter less. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    // \p{M} keeps Devanagari/Gurmukhi vowel signs, which are combining marks.
    .replace(/[^\p{L}\p{M}\p{N}\s'’]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/**
 * Catches misspellings of high-stakes English words ("bleading", "seziure",
 * "unconcious"). Edit distance 1 for short words, 2 for longer ones.
 */
function findCriticalWord(text: string): EmergencyCategory | null {
  for (const token of text.split(" ")) {
    if (token.length < 5) continue;
    for (const [word, category] of Object.entries(CRITICAL_WORDS)) {
      if (token === word) return category;
      const maxDistance = word.length >= 8 ? 2 : 1;
      if (token.length >= word.length - maxDistance && Math.abs(token.length - word.length) <= maxDistance) {
        if (levenshtein(token, word) <= maxDistance) return category;
      }
    }
  }
  return null;
}

/**
 * Returns the matched emergency, or null. Intentionally over-triggers:
 * informational questions ("what causes chest pain?") also warn, because the
 * inline reply is phrased conditionally ("if this is happening right now").
 */
export function detectEmergency(input: string | null | undefined): EmergencyMatch | null {
  if (!input) return null;
  const text = normalize(input);
  if (text.length < 3) return null;

  // Contextual phrases win over bare critical words so "my newborn is not
  // breathing" is reported as a newborn emergency, not a generic breathing one.
  for (const rule of PHRASE_RULES) {
    const match = text.match(rule.re);
    if (match) return { category: rule.category, matched: match[0] };
  }

  const critical = findCriticalWord(text);
  if (critical) return { category: critical, matched: text.slice(0, 120) };

  // Numeric crisis signals written as digits.
  if (/\b(108|112)\b/.test(text) && /\b(emergency|urgent|help)\b/.test(text)) {
    return { category: "severe_injury", matched: "emergency number mentioned" };
  }

  return null;
}

export function isEmergency(input: string | null | undefined): boolean {
  return detectEmergency(input) !== null;
}

/**
 * Fixed emergency reply. Never model-generated, never varies with API
 * availability, and in the languages users actually type.
 */
export const EMERGENCY_REPLY = `⚠️ This might be an emergency. Please get help right now instead of reading more here.

• Call 108 (ambulance) or 112 (all emergencies) — both are free and work 24/7.
• If you can, ask someone nearby to take you to the nearest hospital emergency department. Please don't drive yourself.
• Mental health crisis: call Tele-MANAS on 14416 (free, confidential).

Hindi: अगर यह आपातकाल है, तो तुरंत 108 या 112 पर कॉल करें। खुद गाड़ी न चलाएँ।
Punjabi: ਜੇ ਇਹ ਐਮਰਜੈਂਸੀ ਹੈ ਤਾਂ ਤੁਰੰਤ 108 ਜਾਂ 112 'ਤੇ ਕਾਲ ਕਰੋ। ਆਪਣੇ ਆਪ ਗੱਡੀ ਨਾ ਚਲਾਓ।

I'm an AI helper, not an emergency service, and I can't call anyone for you. Once you or the person you're with is safe and has been seen by a doctor, come back and I'll explain things in plain words.`;

/** Short banner copy used inline above a matched message. */
export const EMERGENCY_BANNER_TITLE = "This may be an emergency — call 108 or 112 now";
