import { type HealthCenter } from "@/lib/healthCenters";

export interface Disease {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Services a center should offer to treat this disease well */
  neededServices: string[];
  /** Which center types can best treat this (in priority order) */
  bestTypes: HealthCenter["type"][];
}

export const diseases: Disease[] = [
  {
    id: "cancer",
    name: "Cancer",
    category: "Serious / Specialist",
    description:
      "Abnormal growth, lumps, unexplained weight loss, or a confirmed cancer diagnosis. Needs a specialist cancer hospital.",
    neededServices: [
      "Oncology",
      "Surgical Oncology",
      "Chemotherapy",
      "Radiation Therapy",
      "Cancer Screening",
      "Palliative Care",
    ],
    bestTypes: ["hospital"],
  },
  {
    id: "brain-tumor",
    name: "Brain Tumor / Brain Surgery",
    category: "Serious / Specialist",
    description:
      "Persistent headaches, seizures, vision or speech problems, or a diagnosed brain tumor. Needs advanced neurosurgery.",
    neededServices: [
      "Neurosurgery",
      "Brain Surgery",
      "Neurology",
      "MRI & Imaging",
      "Radiation Therapy",
      "Neurosciences",
      "ICU",
    ],
    bestTypes: ["hospital"],
  },
  {
    id: "neuro",
    name: "Nerve / Brain Disorders",
    category: "Serious / Specialist",
    description:
      "Stroke, epilepsy, Parkinson's, constant numbness or weakness. Needs a neurology specialist.",
    neededServices: ["Neurology", "Neurosurgery", "MRI & Imaging", "Neurosciences", "Emergency"],
    bestTypes: ["hospital"],
  },
  {
    id: "kidney",
    name: "Kidney Disease",
    category: "Serious / Specialist",
    description: "Kidney failure, dialysis need, or kidney stones. Needs a nephrology unit.",
    neededServices: ["Nephrology", "Dialysis", "Transplants", "Organ Transplants", "Urology", "ICU"],
    bestTypes: ["hospital"],
  },
  {
    id: "heart",
    name: "Heart Problems",
    category: "Serious / Specialist",
    description: "Chest pain, irregular heartbeat, high blood pressure, or heart attack risk.",
    neededServices: ["Cardiology", "Cardiac Sciences", "Emergency", "ICU", "Blood Pressure Check"],
    bestTypes: ["hospital", "clinic"],
  },
  {
    id: "transplant",
    name: "Organ Transplant",
    category: "Serious / Specialist",
    description: "Kidney, liver, or other organ failure that may need a transplant.",
    neededServices: ["Transplants", "Organ Transplants", "Liver Transplant", "Nephrology", "ICU"],
    bestTypes: ["hospital"],
  },
  {
    id: "fever-flu",
    name: "Fever / Flu",
    category: "Common Illness",
    description: "High body temperature, body ache, cough, and tiredness.",
    neededServices: ["General Checkup", "Lab Tests", "Emergency"],
    bestTypes: ["clinic", "hospital", "health_post"],
  },
  {
    id: "covid",
    name: "COVID-19",
    category: "Infection",
    description: "Cough, fever, loss of smell or taste, breathing trouble.",
    neededServices: ["Lab Tests", "Emergency", "General Checkup"],
    bestTypes: ["hospital", "vaccination_center", "clinic"],
  },
  {
    id: "dengue",
    name: "Dengue / Malaria",
    category: "Mosquito-borne",
    description: "High fever with headache, body rash, or chills. Needs a blood test.",
    neededServices: ["Lab Tests", "Emergency", "General Checkup"],
    bestTypes: ["hospital", "clinic"],
  },
  {
    id: "diabetes",
    name: "Diabetes",
    category: "Chronic",
    description: "High blood sugar. Needs regular testing and medicine.",
    neededServices: ["Lab Tests", "Diabetes Supplies", "General Checkup"],
    bestTypes: ["clinic", "hospital", "pharmacy"],
  },
  {
    id: "asthma",
    name: "Asthma / Breathing Issues",
    category: "Chronic",
    description: "Wheezing, short breath, tight chest.",
    neededServices: ["Emergency", "General Checkup", "Pediatrics"],
    bestTypes: ["hospital", "clinic"],
  },
  {
    id: "child-health",
    name: "Child Health",
    category: "Pediatric",
    description: "Checkups, growth, and common illnesses for babies and kids.",
    neededServices: ["Pediatrics", "Vaccinations", "Baby Care", "Childhood Vaccines"],
    bestTypes: ["clinic", "hospital", "vaccination_center"],
  },
  {
    id: "maternal",
    name: "Pregnancy / Maternal Care",
    category: "Maternal",
    description: "Checkups and care before and after having a baby.",
    neededServices: ["Maternal Care", "Women's Health", "General Checkup"],
    bestTypes: ["hospital", "clinic", "health_post"],
  },
  {
    id: "vaccination",
    name: "Vaccines Needed",
    category: "Prevention",
    description: "Flu shots, childhood vaccines, COVID boosters, travel vaccines.",
    neededServices: ["Vaccinations", "All Vaccines", "Flu Shot", "COVID-19 Vaccine", "Immunization"],
    bestTypes: ["vaccination_center", "clinic", "pharmacy"],
  },
  {
    id: "injury",
    name: "Injury / First Aid",
    category: "Emergency",
    description: "Cuts, burns, fractures, or accidents that need quick care.",
    neededServices: ["Emergency", "First Aid", "Surgery", "Orthopedics"],
    bestTypes: ["hospital", "health_post"],
  },
  {
    id: "medicine",
    name: "Need Medicine",
    category: "Pharmacy",
    description: "You have a prescription or need regular medicine refills.",
    neededServices: ["Prescription Drugs", "Prescriptions", "OTC Medicines"],
    bestTypes: ["pharmacy", "clinic"],
  },
];

/**
 * Keywords used by the AI NL-search mapping to detect a disease
 * from natural language ("kidney treatment", "brain tumor", ...).
 */
export const diseaseKeywords: Record<string, string[]> = {
  cancer: ["cancer", "tumor", "tumour", "oncology", "chemotherapy", "carcinoma", "lump", "malignant"],
  "brain-tumor": ["brain tumor", "brain tumour", "brain surgery", "glioma", "meningioma", "neurosurgery"],
  neuro: ["stroke", "epilepsy", "parkinson", "neurology", "seizure", "paralysis", "nerve"],
  kidney: ["kidney", "renal", "dialysis", "nephrology", "stone in kidney", "creatinine"],
  heart: ["heart", "cardiac", "cardiology", "bypass", "angioplasty", "chest pain", "bp", "blood pressure"],
  transplant: ["transplant", "organ failure", "liver transplant", "kidney transplant"],
  "fever-flu": ["fever", "flu", "influenza", "cold", "viral"],
  covid: ["covid", "corona", "sars"],
  dengue: ["dengue", "malaria", "mosquito"],
  diabetes: ["diabetes", "sugar", "insulin"],
  asthma: ["asthma", "breathing", "wheezing", "copd", "lungs"],
  "child-health": ["child", "kid", "baby", "pediatric", "paediatric", "infant"],
  maternal: ["pregnan", "maternal", "delivery", "obstetric", "antenatal"],
  vaccination: ["vaccine", "vaccination", "immunization", "immunisation", "shot"],
  injury: ["injury", "fracture", "accident", "burn", "wound", "trauma"],
  medicine: ["medicine", "pharmacy", "prescription", "tablet", "drug"],
};

/**
 * Score how well a center can treat a disease.
 * Higher score = better match. Matches services and center type.
 */
function scoreCenter(center: HealthCenter, disease: Disease): number {
  let score = 0;

  // +10 for each needed service the center offers
  const servicesLower = center.services.map((s) => s.toLowerCase());
  for (const need of disease.neededServices) {
    const needLower = need.toLowerCase();
    if (servicesLower.some((s) => s.includes(needLower) || needLower.includes(s))) {
      score += 10;
    }
  }

  // Big bonus for being a center type that treats this well
  const typeIndex = disease.bestTypes.indexOf(center.type);
  if (typeIndex === 0) score += 25;
  else if (typeIndex === 1) score += 15;
  else if (typeIndex === 2) score += 8;

  // Rating bonus (0 to 5)
  score += center.rating;

  return score;
}

/**
 * Sort centers so the best hospital/clinic for the chosen disease comes first.
 * Already-distance-sorted centers keep their distance info.
 */
export function findBestCentersForDisease(
  centers: HealthCenter[],
  disease: Disease
): HealthCenter[] {
  return [...centers].sort((a, b) => scoreCenter(b, disease) - scoreCenter(a, disease));
}

/** Detect a disease id from free text using the keyword map. Returns null if none found. */
export function detectDiseaseFromText(text: string): string | null {
  const lower = text.toLowerCase();
  let best: { id: string; len: number } | null = null;

  for (const [id, keywords] of Object.entries(diseaseKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw) && (!best || kw.length > best.len)) {
        best = { id, len: kw.length };
      }
    }
  }

  return best?.id ?? null;
}
