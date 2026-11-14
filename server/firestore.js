import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firestore is only used when credentials are present. Without them the data
// layer keeps talking to MySQL, so an existing deployment is unaffected until
// Firebase is configured on purpose.
export function isFirestoreConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS);
}

let db = null;

function credential() {
  // Preferred: the whole service-account JSON in one env var, so no file has to
  // be shipped to the host.
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the service-account key file's contents as-is."
      );
    }
    // Railway/Render often store "\n" escaped inside the private key.
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    return cert(parsed);
  }
  // Fallback: a key file path provided by the host.
  return applicationDefault();
}

export function getFirestoreDb() {
  if (!isFirestoreConfigured()) {
    throw new Error(
      "Firestore is not configured. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS."
    );
  }
  if (db) return db;

  const app = getApps().length > 0 ? getApps()[0] : initializeApp({ credential: credential() });
  db = getFirestore(app);
  // Optional fields (notes, date_administered) are frequently undefined; without
  // this every write would throw instead of storing the field as absent.
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}
