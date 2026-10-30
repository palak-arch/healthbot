import { describe, it, expect } from "vitest";
import { detectEmergency, isEmergency, EMERGENCY_CONTACTS } from "@/lib/emergency";

/**
 * These are the phrasings real users type — not the tidy keywords a keyword
 * matcher would be designed around. The rule for this suite: when in doubt,
 * an emergency must be detected.
 */
describe("detectEmergency — English", () => {
  it.each([
    ["I have chest pain and my left arm hurts", "cardiac"],
    ["chest tightness since 20 minutes, sweating a lot", "cardiac"],
    ["my father is having a heart attack", "cardiac"],
    ["I can't breathe properly", "breathing"],
    ["cant brethe, feeling suffocated", "breathing"],
    ["she is gasping for air and her lips are blue", "breathing"],
    ["my throat is closing up after eating peanuts", "breathing"],
    ["he passed out and is not waking up", "consciousness"],
    ["she fainted in the bathroom", "consciousness"],
    ["the cut is bleeding and won't stop", "bleeding"],
    ["he is vomiting blood", "bleeding"],
    ["her face is drooping and speech is slurred", "stroke"],
    ["sudden weakness on one side, can't move my arm", "stroke"],
    ["my son is having a seizure right now", "seizure"],
    ["the baby swallowed a whole bottle of pills", "poisoning"],
    ["I took an overdose", "poisoning"],
    ["I want to kill myself", "self_harm"],
    ["I don't want to live anymore", "self_harm"],
    ["my newborn is not breathing", "newborn"],
    ["the baby feels very hot and is limp", "newborn"],
    ["I am 8 months pregnant and the baby stopped moving", "pregnancy"],
    ["pregnant and bleeding heavily", "pregnancy"],
    ["he got a bad electric shock", "severe_injury"],
    ["serious road accident, my brother is stuck and bleeding", "severe_injury"],
  ])("detects %s", (text, category) => {
    expect(detectEmergency(text)?.category).toBe(category);
  });

  it("catches common typos that a literal keyword list would miss", () => {
    expect(isEmergency("i have seziure please help")).toBe(true);
    expect(isEmergency("unconcious and not moving")).toBe(true);
    expect(isEmergency("bleading a lot from the wound")).toBe(true);
    expect(isEmergency("can not brthing")).toBe(true);
    expect(isEmergency("cheast pain right now")).toBe(true);
    expect(isEmergency("suiside thoughts")).toBe(true);
  });

  it("handles all-caps panic typing and stray punctuation", () => {
    expect(isEmergency("CHEST PAIN!!! HELP ME NOW")).toBe(true);
    expect(isEmergency("can't... breathe...")).toBe(true);
  });
});

describe("detectEmergency — Hindi (Devanagari)", () => {
  it.each([
    ["मेरे सीने में दर्द हो रहा है"],
    ["सांस नहीं आ रही है"],
    ["साँस लेने में तकलीफ हो रही है"],
    ["वो बेहोश हो गया है"],
    ["बहुत खून बह रहा है"],
    ["बच्चे को दौरा पड़ा है"],
    ["ज़हर खा लिया है"],
    ["मैं मरना चाहता हूँ"],
    ["लकवा हो गया है, बोली नहीं आ रही"],
    ["गर्भवती हूँ और खून बह रहा है"],
    ["बच्चा सांस नहीं ले रहा"],
  ])("detects %s", (text) => {
    expect(isEmergency(text)).toBe(true);
  });
});

describe("detectEmergency — Punjabi (Gurmukhi)", () => {
  it.each([
    ["ਛਾਤੀ ਵਿੱਚ ਦਰਦ ਹੋ ਰਿਹਾ ਹੈ"],
    ["ਸਾਹ ਨਹੀਂ ਆ ਰਿਹਾ"],
    ["ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ ਹੈ"],
    ["ਉਹ ਬੇਹੋਸ਼ ਹੋ ਗਿਆ"],
    ["ਬਹੁਤ ਖੂਨ ਵਹਿ ਰਿਹਾ ਹੈ"],
    ["ਬੱਚੇ ਨੂੰ ਦੌਰਾ ਪਿਆ ਹੈ"],
    ["ਜ਼ਹਿਰ ਖਾ ਲਿਆ ਹੈ"],
    ["ਮੈਂ ਖੁਦਕੁਸ਼ੀ ਕਰਨਾ ਚਾਹੁੰਦਾ ਹਾਂ"],
    ["ਬੱਚਾ ਸਾਹ ਨਹੀਂ ਲੈ ਰਿਹਾ"],
  ])("detects %s", (text) => {
    expect(isEmergency(text)).toBe(true);
  });
});

describe("detectEmergency — Hinglish / romanised Punjabi", () => {
  it.each([
    ["seene mein dard ho raha hai"],
    ["saans nahi aa rahi hai"],
    ["saans lene mein dikkat ho rahi hai"],
    ["dam ghut raha hai"],
    ["woh behosh ho gaya"],
    ["bahut khoon beh raha hai"],
    ["bachche ko daura pada hai"],
    ["zeher kha liya"],
    ["saap ne kata hai"],
    ["main marna chahta hoon"],
    ["lakwa ho gaya hai"],
    ["garbhwati hoon aur khoon beh raha hai"],
    ["bachcha saans nahi le raha"],
    ["chhati me dard aur pasina aa raha hai"],
  ])("detects %s", (text) => {
    expect(isEmergency(text)).toBe(true);
  });
});

describe("detectEmergency — must not fire on ordinary health chat", () => {
  it.each([
    ["what vaccines do children need"],
    ["tips for healthy eating during pregnancy"],
    ["how can I prevent the flu"],
    ["best hospital for cancer treatment in Mumbai"],
    ["what are the symptoms of dengue"],
    ["my mild cough is getting better"],
    ["is paneer healthy"],
    ["hello there"],
  ])("stays quiet for %s", (text) => {
    expect(isEmergency(text)).toBe(false);
  });

  it("returns null for empty and nullish input", () => {
    expect(detectEmergency("")).toBeNull();
    expect(detectEmergency(null)).toBeNull();
    expect(detectEmergency(undefined)).toBeNull();
  });

  it("is intentionally over-cautious on informational phrasings", () => {
    // Documented trade-off: a false alarm is acceptable, a miss is not.
    expect(isEmergency("what causes chest pain")).toBe(true);
  });
});

describe("EMERGENCY_CONTACTS", () => {
  it("always includes the two India-wide emergency numbers", () => {
    const numbers = EMERGENCY_CONTACTS.map((c) => c.number);
    expect(numbers).toContain("108");
    expect(numbers).toContain("112");
  });

  it("gives every contact a label in all three languages plus a note", () => {
    for (const contact of EMERGENCY_CONTACTS) {
      expect(contact.label.length).toBeGreaterThan(0);
      expect(contact.labelHi.length).toBeGreaterThan(0);
      expect(contact.labelPa.length).toBeGreaterThan(0);
      expect(contact.note.length).toBeGreaterThan(0);
      expect(contact.number).toMatch(/^\d+$/);
    }
  });
});
