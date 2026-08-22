export type CenterType = "hospital" | "clinic" | "pharmacy" | "health_post" | "vaccination_center";

export interface HealthCenter {
  id: string;
  name: string;
  type: CenterType;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  rating: number;
  openHours: string;
  services: string[];
  distance?: string; // populated at runtime from user location
}

export const CENTER_TYPE_CONFIG: Record<CenterType, { label: string; color: string; emoji: string }> = {
  hospital: { label: "Hospital", color: "#ef4444", emoji: "🏥" },
  clinic: { label: "Clinic", color: "#3b82f6", emoji: "🩺" },
  pharmacy: { label: "Pharmacy", color: "#22c55e", emoji: "💊" },
  health_post: { label: "Health Post", color: "#f59e0b", emoji: "🏠" },
  vaccination_center: { label: "Vaccination Center", color: "#8b5cf6", emoji: "💉" },
};

export const healthCenters: HealthCenter[] = [
  {
    id: "hc-1",
    name: "City General Hospital",
    type: "hospital",
    address: "123 Main Street, Downtown",
    phone: "+1-555-0101",
    lat: 40.7128,
    lng: -74.006,
    rating: 4.5,
    openHours: "24/7 Emergency, OPD: 8AM-8PM",
    services: ["Emergency", "Surgery", "Cardiology", "Pediatrics", "Radiology"],
  },
  {
    id: "hc-2",
    name: "Community Health Clinic",
    type: "clinic",
    address: "456 Oak Avenue, Midtown",
    phone: "+1-555-0102",
    lat: 40.7148,
    lng: -74.003,
    rating: 4.2,
    openHours: "Mon-Sat: 9AM-6PM",
    services: ["General Checkup", "Lab Tests", "Vaccinations", "Maternal Care"],
  },
  {
    id: "hc-3",
    name: "HealthPlus Pharmacy",
    type: "pharmacy",
    address: "789 Elm Street, Uptown",
    phone: "+1-555-0103",
    lat: 40.7168,
    lng: -74.001,
    rating: 4.7,
    openHours: "Daily: 8AM-10PM",
    services: ["Prescription Drugs", "OTC Medicines", "Health Supplies", "Blood Pressure Check"],
  },
  {
    id: "hc-4",
    name: "Sunrise Health Post",
    type: "health_post",
    address: "321 Maple Drive, Westside",
    phone: "+1-555-0104",
    lat: 40.7108,
    lng: -74.008,
    rating: 3.9,
    openHours: "Mon-Fri: 8AM-5PM",
    services: ["First Aid", "Immunization", "Health Education", "Maternal Care"],
  },
  {
    id: "hc-5",
    name: "Metro Vaccination Center",
    type: "vaccination_center",
    address: "654 Pine Road, Eastside",
    phone: "+1-555-0105",
    lat: 40.7138,
    lng: -74.005,
    rating: 4.6,
    openHours: "Mon-Sat: 9AM-7PM",
    services: ["COVID-19 Vaccine", "Childhood Vaccines", "Flu Shot", "Travel Vaccines"],
  },
  {
    id: "hc-6",
    name: "Riverside Medical Center",
    type: "hospital",
    address: "987 River Lane, Riverside",
    phone: "+1-555-0106",
    lat: 40.7158,
    lng: -74.009,
    rating: 4.3,
    openHours: "24/7 Emergency, OPD: 7AM-9PM",
    services: ["Emergency", "Orthopedics", "Neurology", "Dental", "Lab Tests"],
  },
  {
    id: "hc-7",
    name: "Family Care Clinic",
    type: "clinic",
    address: "147 Cedar Court, Northside",
    phone: "+1-555-0107",
    lat: 40.7118,
    lng: -74.002,
    rating: 4.4,
    openHours: "Mon-Fri: 8:30AM-5:30PM, Sat: 9AM-1PM",
    services: ["Family Medicine", "Pediatrics", "Vaccinations", "Women's Health"],
  },
  {
    id: "hc-8",
    name: "QuickMeds Pharmacy",
    type: "pharmacy",
    address: "258 Birch Street, Southside",
    phone: "+1-555-0108",
    lat: 40.7098,
    lng: -74.007,
    rating: 4.1,
    openHours: "Daily: 7AM-11PM",
    services: ["Prescriptions", "Herbal Medicine", "Baby Care", "Diabetes Supplies"],
  },
  {
    id: "hc-9",
    name: "Central Vaccination Hub",
    type: "vaccination_center",
    address: "369 Walnut Avenue, Central",
    phone: "+1-555-0109",
    lat: 40.7143,
    lng: -73.998,
    rating: 4.8,
    openHours: "Mon-Sat: 8AM-8PM",
    services: ["All Vaccines", "Booster Doses", "Childhood Immunization", "Health Records"],
  },
  {
    id: "hc-10",
    name: "Greenfield Health Post",
    type: "health_post",
    address: "741 Spruce Lane, Greenfield",
    phone: "+1-555-0110",
    lat: 40.7088,
    lng: -74.004,
    rating: 3.8,
    openHours: "Mon-Fri: 9AM-4PM",
    services: ["Community Health", "Hygiene Education", "Basic Checkups", "Referrals"],
  },
];

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
      distance: `${calculateDistance(userLat, userLng, c.lat, c.lng).toFixed(1)} km`,
    }))
    .sort((a, b) => {
      const dA = calculateDistance(userLat, userLng, a.lat, a.lng);
      const dB = calculateDistance(userLat, userLng, b.lat, b.lng);
      return dA - dB;
    });
}

/** Default center (New York City) used when user location is unavailable */
export const DEFAULT_CENTER: [number, number] = [40.7128, -74.006];
