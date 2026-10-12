import { describe, it, expect } from "vitest";
import {
  findBestCentersForDisease,
  detectDiseaseFromText,
  diseases,
} from "@/lib/diseases";
import { healthCenters, calculateDistance, sortByDistance, getDirectionsUrl } from "@/lib/healthCenters";

// ─── Disease detection (NL keyword mapping) ───────────────────

describe("detectDiseaseFromText", () => {
  it("detects cancer from various phrasings", () => {
    expect(detectDiseaseFromText("best hospital for cancer treatment")).toBe("cancer");
    expect(detectDiseaseFromText("I have a lump, could it be a tumor?")).toBe("cancer");
    expect(detectDiseaseFromText("chemotherapy centers near me")).toBe("cancer");
  });

  it("detects kidney disease including Hinglish-style phrasing", () => {
    expect(detectDiseaseFromText("kidney treatment hospitals")).toBe("kidney");
    expect(detectDiseaseFromText("dialysis center")).toBe("kidney");
    expect(detectDiseaseFromText("mera creatinine badh gaya")).toBe("kidney");
  });

  it("picks the longest keyword match (brain tumor beats tumor)", () => {
    expect(detectDiseaseFromText("brain tumor surgery")).toBe("brain-tumor");
  });

  it("detects heart, dengue, diabetes, maternal", () => {
    expect(detectDiseaseFromText("chest pain since morning")).toBe("heart");
    expect(detectDiseaseFromText("dengue fever test")).toBe("dengue");
    expect(detectDiseaseFromText("sugar level 300")).toBe("diabetes");
    expect(detectDiseaseFromText("pregnancy checkup")).toBe("maternal");
  });

  it("returns null for non-disease text", () => {
    expect(detectDiseaseFromText("hello there")).toBeNull();
    expect(detectDiseaseFromText("")).toBeNull();
  });
});

// ─── Hospital ranking ─────────────────────────────────────────

describe("findBestCentersForDisease", () => {
  const cancer = diseases.find((d) => d.id === "cancer")!;

  it("ranks Tata Memorial first for cancer", () => {
    const ranked = findBestCentersForDisease(healthCenters, cancer);
    expect(ranked[0].name).toBe("Tata Memorial Hospital");
  });

  it("puts cancer specialists above general hospitals", () => {
    const ranked = findBestCentersForDisease(healthCenters, cancer);
    const adyarIdx = ranked.findIndex((c) => c.name === "Adyar Cancer Institute");
    const medantaIdx = ranked.findIndex((c) => c.name === "Medanta - The Medicity");
    expect(adyarIdx).toBeLessThan(medantaIdx);
  });

  it("does not mutate the input array", () => {
    const original = [...healthCenters];
    findBestCentersForDisease(healthCenters, cancer);
    expect(healthCenters).toEqual(original);
  });

  it("every disease in the library has valid bestTypes", () => {
    const validTypes = ["hospital", "clinic", "pharmacy", "health_post", "vaccination_center"];
    for (const d of diseases) {
      expect(d.bestTypes.length).toBeGreaterThan(0);
      for (const t of d.bestTypes) expect(validTypes).toContain(t);
    }
  });
});

// ─── Geo helpers ──────────────────────────────────────────────

describe("calculateDistance", () => {
  it("returns 0 for the same point", () => {
    expect(calculateDistance(28.5, 77.2, 28.5, 77.2)).toBe(0);
  });

  it("Delhi to Mumbai is roughly 1150-1250 km", () => {
    const d = calculateDistance(28.5672, 77.21, 19.0021, 72.8434);
    expect(d).toBeGreaterThan(1100);
    expect(d).toBeLessThan(1300);
  });

  it("is symmetric", () => {
    const ab = calculateDistance(28.5, 77.2, 19.0, 72.8);
    const ba = calculateDistance(19.0, 72.8, 28.5, 77.2);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });
});

describe("sortByDistance", () => {
  it("sorts by distance from the user", () => {
    // User in Chandigarh
    const sorted = sortByDistance(healthCenters, 30.7333, 76.7794);
    // PGIMER (Chandigarh) must come first
    expect(sorted[0].name).toBe("PGIMER");
    // Every hospital should get a distance string
    for (const c of sorted) expect(c.distance).toMatch(/km$/);
  });
});

describe("getDirectionsUrl", () => {
  const hospital = { lat: 28.5672, lng: 77.21, name: "AIIMS" };

  it("includes origin when user location is known", () => {
    const url = getDirectionsUrl(hospital, [30.7333, 76.7794]);
    expect(url).toContain("origin=30.7333,76.7794");
    expect(url).toContain("destination=28.5672,77.21");
    expect(url).toContain("travelmode=driving");
  });

  it("omits origin so Google uses device location", () => {
    const url = getDirectionsUrl(hospital, null);
    expect(url).not.toContain("origin=");
    expect(url).toContain("destination=28.5672,77.21");
  });
});
