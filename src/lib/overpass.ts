import { type HealthCenter, type CenterType, calculateDistance } from "@/lib/healthCenters";

/**
 * Live hospital data from OpenStreetMap via the Overpass API.
 * This is REAL, verifiable data (attribution: OpenStreetMap contributors, ODbL).
 * Fields OSM does not provide (rating, cost band) are marked unknown — we never
 * fake provenance.
 */

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const QUERY_TIMEOUT_SEC = 25;

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: [number, number];
  tags?: Record<string, string>;
}

/** Map OSM amenity/healthcare tags to our CenterType */
function mapOsmType(tags: Record<string, string>): CenterType | null {
  const amenity = tags.amenity;
  const healthcare = tags.healthcare;

  if (amenity === "hospital" || healthcare === "hospital") return "hospital";
  if (amenity === "clinic" || healthcare === "clinic") return "clinic";
  if (amenity === "pharmacy" || healthcare === "pharmacy") return "pharmacy";
  if (amenity === "doctors") return "clinic";
  if (healthcare === "centre" || healthcare === "health_centre") return "health_post";
  return null;
}

/** Guess services from OSM tags (healthcare:speciality etc.) */
function extractServices(tags: Record<string, string>): string[] {
  const services: string[] = [];
  const spec = tags["healthcare:speciality"] || "";
  if (spec) {
    // OSM speciality values are semicolon-separated, e.g. "cardiology;oncology"
    for (const s of spec.split(";")) {
      const clean = s.trim().replace(/_/g, " ");
      if (clean) services.push(clean.replace(/\b\w/g, (c) => c.toUpperCase()));
    }
  }
  if (tags.emergency === "yes") services.push("Emergency");
  if (tags.amenity === "pharmacy") services.push("Prescription Drugs");
  if (services.length === 0) services.push("General Care");
  return services.slice(0, 6);
}

/**
 * Fetch real health facilities near a coordinate using the Overpass API.
 * Returns centers with source: "osm" provenance.
 */
export async function fetchNearbyCenters(
  lat: number,
  lng: number,
  radiusKm = 25,
  signal?: AbortSignal
): Promise<HealthCenter[]> {
  const radiusM = Math.round(radiusKm * 1000);

  const query = `
    [out:json][timeout:${QUERY_TIMEOUT_SEC}];
    (
      nwr["amenity"~"^(hospital|clinic)$"](around:${radiusM},${lat},${lng});
      nwr["healthcare"~"^(hospital|clinic|centre|health_centre)$"](around:${radiusM},${lat},${lng});
      nwr["amenity"="pharmacy"](around:${radiusM},${lat},${lng});
    );
    out center tags ${Math.min(120, Math.max(40, Math.round(radiusKm * 4)))};
  `;

  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          // Overpass rejects requests without a UA from some networks (406)
          "User-Agent": "HealthBot-Demo/1.0 (hackathon project; contact: demo@example.com)",
          Accept: "application/json",
        },
        body: `data=${encodeURIComponent(query)}`,
        signal,
      });

      if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);

      const data = (await res.json()) as { elements?: OverpassElement[] };
      const elements = data.elements ?? [];

      const centers: HealthCenter[] = [];
      const seen = new Set<string>();

      for (const el of elements) {
        const tags = el.tags ?? {};
        const type = mapOsmType(tags);
        if (!type) continue;

        const osmLat = el.lat ?? el.center?.[0];
        const osmLng = el.lon ?? el.center?.[1];
        if (osmLat === undefined || osmLng === undefined) continue;

        const osmId = `${el.type}/${el.id}`;
        if (seen.has(osmId)) continue;
        seen.add(osmId);

        const name = tags.name || "Unnamed facility";
        const parts = [
          tags["addr:housenumber"],
          tags["addr:street"],
          tags["addr:suburb"],
          tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
          tags["addr:state"],
        ].filter(Boolean);
        const address = parts.length > 0 ? parts.join(", ") : tags["addr:full"] || "(address not mapped)";

        const km = calculateDistance(lat, lng, osmLat, osmLng);
        // Skip places that leaked outside the radius (Overpass area ways)
        if (km > radiusKm * 1.2) continue;

        centers.push({
          id: `osm-${el.type}-${el.id}`,
          name,
          type,
          city: tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "Near you",
          address,
          phone: tags.phone || tags["contact:phone"],
          lat: osmLat,
          lng: osmLng,
          rating: 0, // OSM has no ratings — shown as "Not rated" in UI
          openHours: tags.opening_hours || "Hours not mapped",
          services: extractServices(tags),
          distance: `${km.toFixed(1)} km`,
          source: "osm",
        });
      }

      // Sort by distance
      return centers.sort(
        (a, b) => parseFloat(a.distance ?? "0") - parseFloat(b.distance ?? "0")
      );
    } catch (err) {
      lastError = err;
      // Try the next endpoint
    }
  }

  throw new Error(
    `Could not reach OpenStreetMap: ${lastError instanceof Error ? lastError.message : "unknown error"}`
  );
}

/** Best-effort free geocoding for a city/place name using Nominatim (OSM). */
export async function geocodePlace(place: string, signal?: AbortSignal): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`,
      {
        signal,
        headers: {
          Accept: "application/json",
          "User-Agent": "HealthBot-Demo/1.0 (hackathon project; contact: demo@example.com)",
        },
      }
    );
    if (!res.ok) return null;
    const results = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (results.length === 0) return null;
    return [parseFloat(results[0].lat), parseFloat(results[0].lon)];
  } catch {
    return null;
  }
}
