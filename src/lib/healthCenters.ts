export type CenterType = "hospital" | "clinic" | "pharmacy" | "health_post" | "vaccination_center";

export interface HealthCenter {
  id: string;
  name: string;
  type: CenterType;
  city: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  rating: number;
  openHours: string;
  services: string[];
  distance?: string; // populated at runtime from user location
  /** Provenance: "curated" = demo/simulated data, "osm" = live OpenStreetMap (real) */
  source?: "curated" | "osm";
  // ── Simulated metrics (demo only, clearly labelled in UI) ──
  avgTreatmentCostInr?: number; // simulated average cost for the flagship treatment
  beds?: number; // simulated bed count
  annualPatients?: number; // simulated patients treated per year
}

export const CENTER_TYPE_CONFIG: Record<CenterType, { label: string; color: string; emoji: string }> = {
  hospital: { label: "Hospital", color: "#ef4444", emoji: "🏥" },
  clinic: { label: "Clinic", color: "#3b82f6", emoji: "🩺" },
  pharmacy: { label: "Pharmacy", color: "#22c55e", emoji: "💊" },
  health_post: { label: "Health Post", color: "#f59e0b", emoji: "🏠" },
  vaccination_center: { label: "Vaccination Center", color: "#8b5cf6", emoji: "💉" },
};

/**
 * Real top hospitals across India for serious diseases
 * (cancer, brain tumor, heart problems, etc.).
 * Ordered roughly by overall national reputation.
 */
export const healthCenters: HealthCenter[] = [
  {
    id: "hc-1",
    name: "AIIMS New Delhi",
    type: "hospital",
    city: "New Delhi",
    address: "Ansari Nagar, New Delhi",
    phone: "011-26588500",
    lat: 28.5672,
    lng: 77.21,
    rating: 4.9,
    openHours: "24/7 Emergency, OPD: 9AM-1PM",
    services: ["Oncology", "Neurosurgery", "Neurology", "Cardiology", "Radiation Therapy", "Chemotherapy", "Transplants", "Emergency"],
    source: "curated",
    avgTreatmentCostInr: 85000,
    beds: 2500,
    annualPatients: 4000000,
  },
  {
    id: "hc-2",
    name: "Tata Memorial Hospital",
    type: "hospital",
    city: "Mumbai",
    address: "Parel, Mumbai, Maharashtra",
    phone: "022-24177000",
    lat: 19.0021,
    lng: 72.8434,
    rating: 4.9,
    openHours: "24/7 Emergency, OPD: 8AM-4PM",
    services: ["Oncology", "Surgical Oncology", "Chemotherapy", "Radiation Therapy", "Cancer Screening", "Emergency", "Palliative Care"],
    source: "curated",
    avgTreatmentCostInr: 60000,
    beds: 1800,
    annualPatients: 700000,
  },
  {
    id: "hc-3",
    name: "Christian Medical College (CMC)",
    type: "hospital",
    city: "Vellore",
    address: "Ida Scudder Road, Vellore, Tamil Nadu",
    phone: "0416-2281000",
    lat: 12.9239,
    lng: 79.1356,
    rating: 4.8,
    openHours: "24/7 Emergency, OPD: 8AM-4PM",
    services: ["Neurology", "Neurosurgery", "Cardiology", "Oncology", "Lab Tests", "Transplants", "Emergency"],
    source: "curated",
    avgTreatmentCostInr: 70000,
    beds: 3200,
    annualPatients: 3000000,
  },
  {
    id: "hc-4",
    name: "NIMHANS",
    type: "hospital",
    city: "Bengaluru",
    address: "Hosur Road, Bengaluru, Karnataka",
    phone: "080-26995000",
    lat: 12.9438,
    lng: 77.597,
    rating: 4.7,
    openHours: "24/7 Emergency, OPD: 9AM-1PM",
    services: ["Neurosurgery", "Neurology", "Brain Surgery", "MRI & Imaging", "Emergency", "Psychiatry"],
    source: "curated",
    avgTreatmentCostInr: 120000,
    beds: 1000,
    annualPatients: 900000,
  },
  {
    id: "hc-5",
    name: "Apollo Hospitals Greams Road",
    type: "hospital",
    city: "Chennai",
    address: "Greams Road, Chennai, Tamil Nadu",
    phone: "044-28293333",
    lat: 13.0637,
    lng: 80.2514,
    rating: 4.7,
    openHours: "24/7 Emergency",
    services: ["Oncology", "Neurosurgery", "Cardiology", "Radiation Therapy", "Organ Transplants", "Robotic Surgery", "Emergency"],
    source: "curated",
    avgTreatmentCostInr: 180000,
    beds: 560,
    annualPatients: 800000,
  },
  {
    id: "hc-6",
    name: "PGIMER",
    type: "hospital",
    city: "Chandigarh",
    address: "Sector 12, Chandigarh",
    phone: "0172-2747585",
    lat: 30.7642,
    lng: 76.7752,
    rating: 4.7,
    openHours: "24/7 Emergency, OPD: 9AM-1PM",
    services: ["Oncology", "Neurosurgery", "Neurology", "Cardiology", "Radiation Therapy", "Emergency", "Lab Tests"],
    source: "curated",
    avgTreatmentCostInr: 65000,
    beds: 1900,
    annualPatients: 2000000,
  },
  {
    id: "hc-7",
    name: "Medanta - The Medicity",
    type: "hospital",
    city: "Gurugram",
    address: "CH Baktawar Singh Road, Gurugram, Haryana",
    phone: "0124-4141414",
    lat: 28.4595,
    lng: 77.0266,
    rating: 4.6,
    openHours: "24/7 Emergency",
    services: ["Cardiology", "Neurosciences", "Oncology", "Liver Transplant", "Radiation Therapy", "Emergency"],
    source: "curated",
    avgTreatmentCostInr: 220000,
    beds: 1250,
    annualPatients: 950000,
  },
  {
    id: "hc-8",
    name: "Fortis Memorial Research Institute",
    type: "hospital",
    city: "Gurugram",
    address: "Sector 44, Gurugram, Haryana",
    phone: "0124-4962200",
    lat: 28.4706,
    lng: 77.0719,
    rating: 4.6,
    openHours: "24/7 Emergency",
    services: ["Neurosciences", "Oncology", "Cardiology", "Radiation Therapy", "Brain Surgery", "Emergency", "ICU"],
    source: "curated",
    avgTreatmentCostInr: 250000,
    beds: 300,
    annualPatients: 400000,
  },
  {
    id: "hc-9",
    name: "Kokilaben Dhirubhai Ambani Hospital",
    type: "hospital",
    city: "Mumbai",
    address: "Andheri West, Mumbai, Maharashtra",
    phone: "022-42696969",
    lat: 19.1359,
    lng: 72.8281,
    rating: 4.6,
    openHours: "24/7 Emergency",
    services: ["Oncology", "Neurosurgery", "Cardiac Sciences", "Robotic Surgery", "Radiation Therapy", "Emergency"],
    source: "curated",
    avgTreatmentCostInr: 240000,
    beds: 750,
    annualPatients: 600000,
  },
  {
    id: "hc-10",
    name: "Adyar Cancer Institute",
    type: "hospital",
    city: "Chennai",
    address: "Sardar Patel Road, Adyar, Chennai, Tamil Nadu",
    phone: "044-24910754",
    lat: 13.0067,
    lng: 80.257,
    rating: 4.6,
    openHours: "Mon-Sat: 8AM-4PM",
    services: ["Oncology", "Chemotherapy", "Radiation Therapy", "Cancer Screening", "Palliative Care", "Surgical Oncology"],
    source: "curated",
    avgTreatmentCostInr: 40000,
    beds: 650,
    annualPatients: 450000,
  },
  {
    id: "hc-11",
    name: "Sanjay Gandhi Postgraduate Institute (SGPGI)",
    type: "hospital",
    city: "Lucknow",
    address: "Raebareli Road, Lucknow, Uttar Pradesh",
    lat: 26.7606,
    lng: 80.9254,
    rating: 4.6,
    openHours: "24/7 Emergency, OPD: 9AM-12PM",
    services: ["Neurology", "Neurosurgery", "Oncology", "Cardiology", "Nephrology", "Emergency"],
    source: "curated",
    avgTreatmentCostInr: 55000,
    beds: 1500,
    annualPatients: 1600000,
  },
  {
    id: "hc-12",
    name: "Rajiv Gandhi Cancer Institute",
    type: "hospital",
    city: "New Delhi",
    address: "Sector 5, Rohini, New Delhi",
    phone: "011-47022222",
    lat: 28.7186,
    lng: 77.111,
    rating: 4.5,
    openHours: "24/7 Emergency",
    services: ["Oncology", "Surgical Oncology", "Chemotherapy", "Radiation Therapy", "Cancer Screening", "Emergency"],
    source: "curated",
    avgTreatmentCostInr: 150000,
    beds: 450,
    annualPatients: 250000,
  },
  {
    id: "hc-13",
    name: "Manipal Hospital Old Airport Road",
    type: "hospital",
    city: "Bengaluru",
    address: "Old Airport Road, Bengaluru, Karnataka",
    phone: "080-25024444",
    lat: 12.9584,
    lng: 77.6513,
    rating: 4.5,
    openHours: "24/7 Emergency",
    services: ["Oncology", "Neurosurgery", "Cardiology", "Organ Transplants", "Emergency", "Lab Tests"],
    source: "curated",
    avgTreatmentCostInr: 190000,
    beds: 650,
    annualPatients: 500000,
  },
  {
    id: "hc-14",
    name: "Kidwai Memorial Institute of Oncology",
    type: "hospital",
    city: "Bengaluru",
    address: "Hosur Road, Bengaluru, Karnataka",
    lat: 12.9402,
    lng: 77.5672,
    rating: 4.4,
    openHours: "Mon-Sat: 9AM-5PM",
    services: ["Oncology", "Chemotherapy", "Radiation Therapy", "Surgical Oncology", "Cancer Screening"],
    source: "curated",
    avgTreatmentCostInr: 35000,
    beds: 500,
    annualPatients: 300000,
  },
];

/**
 * Google Maps directions URL from an origin (user) to a center.
 * Opens turn-by-turn navigation in the app/browser.
 */
export function getDirectionsUrl(
  center: { lat: number; lng: number; name: string },
  origin?: [number, number] | null
): string {
  const dest = `${center.lat},${center.lng}`;
  if (origin) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin[0]},${origin[1]}&destination=${dest}&travelmode=driving`;
  }
  // No user location: let Google Maps use the device's current location
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
}

/** Haversine distance in km between two lat/lng points */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Sort centers by distance from a point */
export function sortByDistance(
  centers: HealthCenter[],
  userLat: number,
  userLng: number
): HealthCenter[] {
  return [...centers]
    .map((c) => ({
      ...c,
      distance: `${calculateDistance(userLat, userLng, c.lat, c.lng).toFixed(0)} km`,
    }))
    .sort((a, b) => {
      const dA = calculateDistance(userLat, userLng, a.lat, a.lng);
      const dB = calculateDistance(userLat, userLng, b.lat, b.lng);
      return dA - dB;
    });
}

/** Default map center (middle of India) used when user location is unavailable */
export const DEFAULT_CENTER: [number, number] = [22.5937, 78.9629];
