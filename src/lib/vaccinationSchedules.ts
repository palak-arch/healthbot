export type AgeGroup = "infant" | "child" | "adolescent" | "adult";

export interface Vaccine {
  id: string;
  name: string;
  description: string;
  doses: string;
  schedule: string;
  notes?: string;
}

export interface AgeGroupSchedule {
  ageGroup: AgeGroup;
  label: string;
  ageRange: string;
  description: string;
  vaccines: Vaccine[];
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  infant: "Infants (0–12 months)",
  child: "Children (1–6 years)",
  adolescent: "Adolescents (7–17 years)",
  adult: "Adults (18+ years)",
};

export const vaccinationSchedules: AgeGroupSchedule[] = [
  {
    ageGroup: "infant",
    label: "Infants (0–12 months)",
    ageRange: "0–12 months",
    description: "Critical early immunizations to protect newborns and infants from life-threatening diseases.",
    vaccines: [
      {
        id: "bcg",
        name: "BCG (Tuberculosis)",
        description: "Protects against severe forms of tuberculosis, including TB meningitis.",
        doses: "1 dose",
        schedule: "At birth",
      },
      {
        id: "hepb-birth",
        name: "Hepatitis B (Birth dose)",
        description: "First dose of Hepatitis B vaccine, crucial for preventing mother-to-child transmission.",
        doses: "1 dose",
        schedule: "Within 24 hours of birth",
      },
      {
        id: "opv-1",
        name: "OPV (Oral Polio Vaccine)",
        description: "Protects against poliovirus, which can cause paralysis.",
        doses: "3 doses + booster",
        schedule: "6 weeks, 10 weeks, 14 weeks; booster at 16–18 months",
      },
      {
        id: "ipv",
        name: "IPV (Inactivated Polio Vaccine)",
        description: "Injected form of polio vaccine for additional protection.",
        doses: "1 dose",
        schedule: "14 weeks",
      },
      {
        id: "pentavalent-1",
        name: "Pentavalent Vaccine",
        description: "Combines protection against Diphtheria, Tetanus, Pertussis, Hepatitis B, and Haemophilus influenzae type b.",
        doses: "3 doses",
        schedule: "6 weeks, 10 weeks, 14 weeks",
      },
      {
        id: "pcv",
        name: "PCV (Pneumococcal Conjugate)",
        description: "Protects against pneumococcal disease, a leading cause of pneumonia in children.",
        doses: "3 doses + booster",
        schedule: "6 weeks, 10 weeks, 14 weeks; booster at 12–15 months",
      },
      {
        id: "rotavirus",
        name: "Rotavirus Vaccine",
        description: "Protects against rotavirus, the most common cause of severe diarrheal disease in infants.",
        doses: "2–3 doses (depending on brand)",
        schedule: "6 weeks, 10 weeks, 14 weeks",
      },
      {
        id: "mmr-1",
        name: "MMR (Measles, Mumps, Rubella)",
        description: "Combined vaccine protecting against three viral diseases.",
        doses: "2 doses",
        schedule: "First dose at 9–12 months",
      },
    ],
  },
  {
    ageGroup: "child",
    label: "Children (1–6 years)",
    ageRange: "1–6 years",
    description: "Booster doses and additional vaccines to strengthen immunity during early childhood.",
    vaccines: [
      {
        id: "mmr-2",
        name: "MMR (2nd dose)",
        description: "Booster dose for stronger, longer-lasting immunity against measles, mumps, and rubella.",
        doses: "1 dose",
        schedule: "15–18 months",
      },
      {
        id: "dtap-booster",
        name: "DTaP Booster",
        description: "Booster for Diphtheria, Tetanus, and Pertussis protection.",
        doses: "1 dose",
        schedule: "15–18 months; 4–6 years",
      },
      {
        id: "opv-booster",
        name: "OPV Booster",
        description: "Booster dose to maintain polio immunity.",
        doses: "1 dose",
        schedule: "16–18 months; 4–6 years",
      },
      {
        id: "hepb-child",
        name: "Hepatitis B (Completion)",
        description: "Final dose to complete the Hepatitis B series.",
        doses: "1 dose",
        schedule: "12–15 months (if not completed earlier)",
      },
      {
        id: "varicella",
        name: "Varicella (Chickenpox)",
        description: "Protects against chickenpox, which can cause serious complications in children.",
        doses: "1 dose",
        schedule: "12–15 months; 4–6 years",
      },
      {
        id: "hepa-child",
        name: "Hepatitis A",
        description: "Protects against Hepatitis A virus, spread through contaminated food or water.",
        doses: "2 doses",
        schedule: "12–23 months (6 months apart)",
      },
    ],
  },
  {
    ageGroup: "adolescent",
    label: "Adolescents (7–17 years)",
    ageRange: "7–17 years",
    description: "Catch-up doses and vaccines recommended during the adolescent years.",
    vaccines: [
      {
        id: "tdap",
        name: "Tdap (Tetanus, Diphtheria, Pertussis)",
        description: "Booster dose especially important before entering secondary school.",
        doses: "1 dose",
        schedule: "11–12 years",
      },
      {
        id: "hpv",
        name: "HPV (Human Papillomavirus)",
        description: "Protects against HPV infections that can cause cervical and other cancers.",
        doses: "2–3 doses",
        schedule: "9–14 years (2 doses); 15+ years (3 doses)",
      },
      {
        id: "menacwy",
        name: "MenACWY (Meningococcal)",
        description: "Protects against meningococcal disease, which can cause meningitis and sepsis.",
        doses: "1–2 doses",
        schedule: "11–12 years; booster at 16 years",
      },
      {
        id: "flu-ado",
        name: "Influenza (Annual)",
        description: "Annual flu vaccine to protect against seasonal influenza viruses.",
        doses: "1 dose yearly",
        schedule: "Every year, preferably before flu season",
        notes: "Recommended annually for all adolescents.",
      },
      {
        id: "covid-ado",
        name: "COVID-19",
        description: "Vaccination against SARS-CoV-2 virus. Follow current local guidelines for dosing.",
        doses: "Per current guidelines",
        schedule: "As recommended by health authorities",
        notes: "Schedule may vary based on local health authority recommendations.",
      },
    ],
  },
  {
    ageGroup: "adult",
    label: "Adults (18+ years)",
    ageRange: "18+ years",
    description: "Essential boosters and vaccines for adult health maintenance and travel.",
    vaccines: [
      {
        id: "td-booster",
        name: "Td/Tdap Booster",
        description: "Tetanus and diphtheria booster, with pertussis component recommended for adults.",
        doses: "1 dose every 10 years",
        schedule: "Every 10 years; Tdap once if not received in adolescence",
      },
      {
        id: "flu-adult",
        name: "Influenza (Annual)",
        description: "Annual flu vaccine, especially important for adults over 65 and those with chronic conditions.",
        doses: "1 dose yearly",
        schedule: "Every year before flu season",
      },
      {
        id: "pneumo-adult",
        name: "Pneumococcal Vaccine",
        description: "Recommended for adults 65+ and those with certain medical conditions.",
        doses: "1–2 doses",
        schedule: "65+ years or as recommended by doctor",
      },
      {
        id: "shingles",
        name: "Shingles (Zoster)",
        description: "Recommended for adults 50+ to prevent shingles and its complications.",
        doses: "2 doses",
        schedule: "50+ years (2–6 months apart)",
      },
      {
        id: "hepa-adult",
        name: "Hepatitis A & B",
        description: "For adults not previously vaccinated, especially travelers or those at risk.",
        doses: "Per schedule",
        schedule: "As recommended; travel vaccines should be given 2–4 weeks before travel",
        notes: "Important for travelers to endemic regions.",
      },
      {
        id: "covid-adult",
        name: "COVID-19",
        description: "Stay up to date with current COVID-19 vaccine recommendations.",
        doses: "Per current guidelines",
        schedule: "As recommended by health authorities",
      },
    ],
  },
];

export function getScheduleByAgeGroup(ageGroup: AgeGroup): AgeGroupSchedule | undefined {
  return vaccinationSchedules.find((s) => s.ageGroup === ageGroup);
}

export function getTotalVaccines(): number {
  return vaccinationSchedules.reduce((sum, group) => sum + group.vaccines.length, 0);
}
