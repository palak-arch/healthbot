export interface DiseaseInfo {
  id: string;
  name: string;
  category: string;
  emoji: string;
  /** What it is — one plain-English paragraph */
  about: string;
  symptoms: string[];
  prevention: string[];
  whenToSeeDoctor: string[];
  /** Simple self-care steps for mild cases while you wait */
  selfCare: string[];
}

/**
 * Educational content only — not a diagnosis. Written in plain language
 * based on WHO / CDC / MoHFW public guidance.
 */
export const diseaseLibrary: DiseaseInfo[] = [
  {
    id: "fever-flu",
    name: "Fever & Flu",
    category: "Common Illness",
    emoji: "🌡️",
    about:
      "Fever means your body is fighting an infection, most often a virus like the flu. It usually passes in a few days with rest and fluids.",
    symptoms: [
      "Body temperature above 100.4°F (38°C)",
      "Body aches and chills",
      "Tiredness and weakness",
      "Headache",
      "Cough and sore throat",
    ],
    prevention: [
      "Get a flu shot every year",
      "Wash hands often with soap",
      "Avoid close contact with sick people",
      "Keep your immune system strong with sleep and good food",
    ],
    whenToSeeDoctor: [
      "Fever lasts more than 3 days",
      "Temperature goes above 103°F (39.4°C)",
      "Trouble breathing or chest pain",
      "Confusion or a stiff neck",
      "Fever in a baby under 3 months old",
    ],
    selfCare: [
      "Rest as much as you can",
      "Drink lots of water, soup, or ORS",
      "Eat light food like khichdi or fruit",
      "Paracetamol can bring fever down — follow the pack",
    ],
  },
  {
    id: "covid",
    name: "COVID-19",
    category: "Infection",
    emoji: "😮‍💨",
    about:
      "COVID-19 is a respiratory infection caused by a coronavirus. Most people recover at home, but some — especially older adults — can get very sick.",
    symptoms: [
      "Fever or chills",
      "Dry cough",
      "Loss of smell or taste",
      "Tiredness",
      "Breathing difficulty in serious cases",
    ],
    prevention: [
      "Stay up to date with COVID vaccines and boosters",
      "Wear a mask in crowded indoor places",
      "Wash hands regularly",
      "Ventilate rooms when possible",
    ],
    whenToSeeDoctor: [
      "Trouble breathing",
      "Oxygen level below 94% (if you have a pulse oximeter)",
      "Chest pain or pressure",
      "Bluish lips or face — go to a hospital NOW",
    ],
    selfCare: [
      "Isolate from others in your home",
      "Rest and drink plenty of fluids",
      "Monitor your temperature and oxygen if possible",
    ],
  },
  {
    id: "dengue",
    name: "Dengue & Malaria",
    category: "Mosquito-borne",
    emoji: "🦟",
    about:
      "Both are spread by mosquito bites. Dengue brings high fever with body rash; malaria brings fever with shaking chills. Both need a blood test to confirm.",
    symptoms: [
      "High fever",
      "Severe headache and pain behind the eyes (dengue)",
      "Shaking chills with sweating (malaria)",
      "Body rash",
      "Muscle and joint pain",
    ],
    prevention: [
      "Use mosquito repellent and nets",
      "Empty standing water in coolers, pots, and tyres",
      "Wear full-sleeve clothes at dawn and dusk",
      "Keep windows screened",
    ],
    whenToSeeDoctor: [
      "Bleeding gums or nose, or easy bruising",
      "Severe belly pain or persistent vomiting",
      "Extreme tiredness or restlessness",
      "Fever with reduced urine — get tested immediately",
    ],
    selfCare: [
      "Get a blood test to confirm which one it is",
      "Drink lots of fluids — dengue dehydrates fast",
      "Do NOT take aspirin or ibuprofen with dengue — use paracetamol only",
    ],
  },
  {
    id: "cancer",
    name: "Cancer",
    category: "Serious / Specialist",
    emoji: "🎗️",
    about:
      "Cancer is when cells grow out of control. Treatment works best when found early — many cancers are curable today with surgery, chemo, and radiation.",
    symptoms: [
      "A lump anywhere on the body",
      "Unexplained weight loss",
      "A wound that doesn't heal",
      "Unusual bleeding",
      "Long-lasting change in bowel or bladder habits",
    ],
    prevention: [
      "Avoid tobacco in every form",
      "Limit alcohol",
      "Get screened (breast, cervical, oral) as advised for your age",
      "Eat plenty of vegetables and fruit, stay active",
      "Get HPV and hepatitis B vaccines",
    ],
    whenToSeeDoctor: [
      "Any of the symptoms above lasting more than 2 weeks",
      "A lump that is growing",
      "Family history of cancer plus symptoms",
    ],
    selfCare: [
      "Don't panic — see a specialist early",
      "Write down your symptoms and how long you've had them",
      "Bring a family member to the appointment",
    ],
  },
  {
    id: "brain-tumor",
    name: "Brain Tumor",
    category: "Serious / Specialist",
    emoji: "🧠",
    about:
      "A brain tumor is an abnormal growth inside the skull. Many are treatable, especially with modern neurosurgery. Early scans make a big difference.",
    symptoms: [
      "New or changing headaches, worse in the morning",
      "Seizures (fits)",
      "Vision or speech problems",
      "Weakness or numbness on one side",
      "Balance problems or unexplained vomiting",
    ],
    prevention: [
      "There's no sure prevention — early detection is key",
      "Don't ignore persistent or unusual headaches",
      "Treat long-standing conditions like high BP",
    ],
    whenToSeeDoctor: [
      "Any seizure — immediately",
      "Headaches that keep getting worse",
      "Sudden vision, speech, or weakness changes — go to a hospital NOW",
    ],
    selfCare: [
      "See a neurologist for a proper exam",
      "Ask whether an MRI is needed",
      "Keep a diary of headache timing and triggers",
    ],
  },
  {
    id: "heart",
    name: "Heart Disease",
    category: "Serious / Specialist",
    emoji: "❤️",
    about:
      "Heart disease covers blocked arteries, rhythm problems, and high blood pressure damage. It's India's biggest killer — but mostly preventable.",
    symptoms: [
      "Chest pain or pressure, especially with exertion",
      "Pain spreading to arm, jaw, or back",
      "Breathlessness on small effort",
      "Palpitations (heart racing)",
      "Swelling in feet",
    ],
    prevention: [
      "Check blood pressure and sugar regularly",
      "Walk or exercise 30 minutes most days",
      "Avoid tobacco; limit salt and fried food",
      "Get cholesterol checked after age 30",
    ],
    whenToSeeDoctor: [
      "Chest pain lasting more than 15 minutes — call an ambulance NOW",
      "Fainting or severe breathlessness",
      "BP consistently above 140/90",
    ],
    selfCare: [
      "Keep BP, sugar, and weight in check",
      "Take prescribed medicines daily — don't skip",
      "Learn your family's heart history",
    ],
  },
  {
    id: "diabetes",
    name: "Diabetes",
    category: "Chronic",
    emoji: "🩸",
    about:
      "Diabetes means too much sugar in your blood. Controlled well, you can live a completely normal life; uncontrolled, it damages eyes, kidneys, and nerves.",
    symptoms: [
      "Very thirsty or hungry often",
      "Peeing a lot, especially at night",
      "Tiredness",
      "Blurry vision",
      "Slow-healing wounds",
    ],
    prevention: [
      "Keep weight in a healthy range",
      "Cut sugary drinks and sweets",
      "Exercise most days",
      "Get sugar tested yearly after age 35 (earlier with family history)",
    ],
    whenToSeeDoctor: [
      "Sugar readings stay high despite medicine",
      "Tingling or numbness in feet",
      "Vision changes",
      "Wounds not healing",
    ],
    selfCare: [
      "Take medicines on time",
      "Check sugar as advised",
      "Care for your feet — check daily for cuts",
      "Eat fibre-rich food; walk after meals",
    ],
  },
  {
    id: "kidney",
    name: "Kidney Disease",
    category: "Serious / Specialist",
    emoji: "🫘",
    about:
      "Kidneys filter your blood. When they fail — often from diabetes or BP — waste builds up. Early kidney disease is silent; a simple blood test catches it.",
    symptoms: [
      "Swelling in feet, ankles, or around eyes",
      "Foamy or blood-tinged urine",
      "Peeing more or less than usual",
      "Tiredness and poor appetite",
      "Itchy skin",
    ],
    prevention: [
      "Control diabetes and blood pressure",
      "Drink enough water",
      "Avoid painkiller overuse (NSAIDs)",
      "Don't ignore urine infections",
    ],
    whenToSeeDoctor: [
      "Swelling that doesn't go away",
      "Very little urine output",
      "Breathlessness with swelling — go to hospital",
      "Creatinine rising on tests",
    ],
    selfCare: [
      "Get creatinine and urine tested if you have diabetes/BP",
      "Limit salt",
      "Take only prescribed medicines",
    ],
  },
  {
    id: "asthma",
    name: "Asthma & Breathing Issues",
    category: "Chronic",
    emoji: "🫁",
    about:
      "Asthma narrows the airways, making breathing hard. With the right inhaler routine, most people live fully normal, active lives.",
    symptoms: [
      "Wheezing (whistling sound while breathing)",
      "Breathlessness",
      "Chest tightness",
      "Coughing at night or early morning",
    ],
    prevention: [
      "Avoid dust, smoke, and strong fumes",
      "Identify and avoid your triggers",
      "Take your controller inhaler daily even when fine",
      "Get flu shots — infections trigger attacks",
    ],
    whenToSeeDoctor: [
      "Inhaler not helping during an attack — emergency",
      "Can't speak full sentences",
      "Blue lips or fingernails — go to hospital NOW",
      "Needing your reliever inhaler more than usual",
    ],
    selfCare: [
      "Always carry your reliever inhaler",
      "Use a spacer for better medicine delivery",
      "Learn your trigger pattern",
    ],
  },
  {
    id: "maternal",
    name: "Pregnancy Care",
    category: "Maternal",
    emoji: "🤰",
    about:
      "Good antenatal care keeps both mother and baby healthy. Regular checkups catch problems like anemia and BP early, when they're easy to fix.",
    symptoms: [
      "Morning sickness (normal in early months)",
      "Fatigue",
      "Swelling in feet (tell your doctor if sudden)",
      "Baby movements — learn the normal pattern",
    ],
    prevention: [
      "Start folic acid before/at start of pregnancy",
      "Register at a health center early",
      "Get all scheduled antenatal checkups and scans",
      "Take iron and calcium as prescribed",
      "Get tetanus vaccine",
    ],
    whenToSeeDoctor: [
      "Bleeding at any point — immediately",
      "Severe headache with blurred vision",
      "Baby moving less than usual",
      "Water breaking before 37 weeks",
      "Fever or bad belly pain",
    ],
    selfCare: [
      "Eat iron and protein-rich food",
      "Rest, but stay gently active",
      "Avoid alcohol, tobacco, and self-medication",
    ],
  },
  {
    id: "child-health",
    name: "Child Health",
    category: "Pediatric",
    emoji: "🧒",
    about:
      "Children get 6-8 minor infections a year — it's how immunity builds. Vaccines on schedule and good nutrition prevent the dangerous ones.",
    symptoms: [
      "Fever (common, usually viral)",
      "Runny nose and cough",
      "Loose motion — watch for dehydration",
      "Poor feeding in babies — take seriously",
    ],
    prevention: [
      "Follow the immunization schedule exactly",
      "Exclusive breastfeeding for 6 months",
      "Wash hands before feeding",
      "Deworm as advised by your doctor",
    ],
    whenToSeeDoctor: [
      "Baby under 3 months with any fever",
      "No feeding, very sleepy, or very irritable",
      "Sunken eyes, no tears, dry mouth (dehydration)",
      "Fast breathing or chest indrawing",
      "Rash with fever",
    ],
    selfCare: [
      "Keep the vaccination card safe and up to date",
      "ORS at home for loose motions",
      "Sponge with lukewarm water for high fever; dress light",
    ],
  },
];
