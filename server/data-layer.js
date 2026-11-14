import crypto from "node:crypto";
import pool from "./db.js";
import { getFirestoreDb, isFirestoreConfigured } from "./firestore.js";

// Vaccination records and patient profiles can live in either store. The routes
// call these functions and never touch SQL or Firestore directly, so moving a
// collection is a change here rather than in every endpoint.
//
// Field names stay snake_case in both stores because that is what the API has
// always returned (the UI reads `vaccine_name`, `full_name`, ...). Keeping the
// contract identical means the client does not change during the migration.
//
// Which store is used is decided by configuration alone, never per request:
// silently falling back to MySQL when a Firestore write fails would split the
// same records across two databases.

const VACCINATIONS = "vaccination_records";

const nowIso = () => new Date().toISOString();

/** MySQL DATE columns arrive as Date objects; Firestore stores plain strings. */
function sortKey(value) {
  if (!value) return "9999-12-31";
  return value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);
}

// ─── Vaccinations ─────────────────────────────────────────────
// Owned by whoever holds the session id (see ownerKey in index.js), which is the
// same scoping the SQL path uses.

async function vaccineListMysql(ownerId) {
  const [rows] = await pool.query(
    "SELECT * FROM vaccination_records WHERE user_id = ? ORDER BY scheduled_date ASC",
    [ownerId]
  );
  return rows;
}

async function vaccineListFirestore(ownerId) {
  // Filtering by owner and sorting in memory avoids a composite index, which
  // would otherwise have to be created by hand before the endpoint works.
  const snap = await getFirestoreDb()
    .collection(VACCINATIONS)
    .where("user_id", "==", ownerId)
    .get();
  return snap.docs
    .map((doc) => doc.data())
    .sort((a, b) => sortKey(a.scheduled_date).localeCompare(sortKey(b.scheduled_date)));
}

async function vaccineGetMysql(ownerId, id) {
  const [rows] = await pool.query(
    "SELECT * FROM vaccination_records WHERE id = ? AND user_id = ?",
    [id, ownerId]
  );
  return rows[0] || null;
}

async function vaccineGetFirestore(ownerId, id) {
  const snap = await getFirestoreDb().collection(VACCINATIONS).doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data();
  // Ownership is a field here, so it must be checked on every read.
  return data.user_id === ownerId ? data : null;
}

async function vaccineCreateMysql(ownerId, record) {
  await pool.query(
    `INSERT INTO vaccination_records (id, user_id, vaccine_name, scheduled_date, date_administered, status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      ownerId,
      record.vaccine_name,
      record.scheduled_date || null,
      record.date_administered || null,
      record.status || "scheduled",
      record.notes || null,
    ]
  );
  return vaccineGetMysql(ownerId, record.id);
}

async function vaccineCreateFirestore(ownerId, record) {
  const doc = {
    ...record,
    user_id: ownerId,
    created_at: record.created_at || nowIso(),
  };
  // create() fails when the id already exists, matching INSERT semantics rather
  // than silently overwriting another record.
  await getFirestoreDb().collection(VACCINATIONS).doc(record.id).create(doc);
  return doc;
}

async function vaccineUpdateMysql(ownerId, id, patch) {
  const fields = [];
  const values = [];

  if (patch.status !== undefined) {
    fields.push("status = ?");
    values.push(patch.status);
  }
  if (patch.date_administered !== undefined) {
    fields.push("date_administered = ?");
    values.push(patch.date_administered);
  }
  if (patch.notes !== undefined) {
    fields.push("notes = ?");
    values.push(patch.notes);
  }

  // An update with no recognised field used to produce invalid SQL; return the
  // record as-is instead.
  if (fields.length === 0) return vaccineGetMysql(ownerId, id);

  values.push(id, ownerId);
  await pool.query(
    `UPDATE vaccination_records SET ${fields.join(", ")} WHERE id = ? AND user_id = ?`,
    values
  );
  return vaccineGetMysql(ownerId, id);
}

async function vaccineUpdateFirestore(ownerId, id, patch) {
  const current = await vaccineGetFirestore(ownerId, id);
  if (!current) return null;

  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
  if (Object.keys(clean).length === 0) return current;

  await getFirestoreDb().collection(VACCINATIONS).doc(id).update(clean);
  return { ...current, ...clean };
}

async function vaccineRemoveMysql(ownerId, id) {
  const [result] = await pool.query(
    "DELETE FROM vaccination_records WHERE id = ? AND user_id = ?",
    [id, ownerId]
  );
  return result.affectedRows > 0;
}

async function vaccineRemoveFirestore(ownerId, id) {
  const current = await vaccineGetFirestore(ownerId, id);
  if (!current) return false;
  await getFirestoreDb().collection(VACCINATIONS).doc(id).delete();
  return true;
}

export const vaccinations = {
  async list(ownerId) {
    return isFirestoreConfigured() ? vaccineListFirestore(ownerId) : vaccineListMysql(ownerId);
  },
  async get(ownerId, id) {
    return isFirestoreConfigured()
      ? vaccineGetFirestore(ownerId, id)
      : vaccineGetMysql(ownerId, id);
  },
  async create(ownerId, record) {
    const withId = { ...record, id: record.id || crypto.randomUUID() };
    return isFirestoreConfigured()
      ? vaccineCreateFirestore(ownerId, withId)
      : vaccineCreateMysql(ownerId, withId);
  },
  async update(ownerId, id, patch) {
    return isFirestoreConfigured()
      ? vaccineUpdateFirestore(ownerId, id, patch)
      : vaccineUpdateMysql(ownerId, id, patch);
  },
  async remove(ownerId, id) {
    return isFirestoreConfigured()
      ? vaccineRemoveFirestore(ownerId, id)
      : vaccineRemoveMysql(ownerId, id);
  },
};

// ─── Patient records ──────────────────────────────────────────
// These belong to a logged-in patient (req.patientUser.id), so the Firestore
// layout uses a subcollection: ownership is the path, not a field to remember.

function patientCollection(ownerId) {
  return getFirestoreDb().collection("users").doc(ownerId).collection("patients");
}

async function patientListMysql(ownerId) {
  const [rows] = await pool.query(
    "SELECT * FROM patient_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
    [ownerId]
  );
  return rows;
}

async function patientListFirestore(ownerId) {
  const snap = await patientCollection(ownerId).get();
  return snap.docs
    .map((doc) => doc.data())
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, 100);
}

async function patientGetMysql(ownerId, id) {
  const [rows] = await pool.query(
    "SELECT * FROM patient_records WHERE id = ? AND user_id = ?",
    [id, ownerId]
  );
  return rows[0] || null;
}

async function patientGetFirestore(ownerId, id) {
  const snap = await patientCollection(ownerId).doc(id).get();
  return snap.exists ? snap.data() : null;
}

async function patientUpsertMysql(ownerId, id, b) {
  await pool.query(
    `INSERT INTO patient_records
     (id, user_id, full_name, age, gender, blood_group, phone, conditions, medications, allergies, emergency_contact, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       full_name=VALUES(full_name), age=VALUES(age), gender=VALUES(gender),
       blood_group=VALUES(blood_group), phone=VALUES(phone), conditions=VALUES(conditions),
       medications=VALUES(medications), allergies=VALUES(allergies),
       emergency_contact=VALUES(emergency_contact), notes=VALUES(notes), updated_at=NOW()`,
    [
      id,
      ownerId,
      b.fullName,
      b.age,
      b.gender || null,
      b.bloodGroup || null,
      b.phone || null,
      JSON.stringify(b.conditions || []),
      JSON.stringify(b.medications || []),
      JSON.stringify(b.allergies || []),
      b.emergencyContact || null,
      b.notes || null,
    ]
  );
  const [rows] = await pool.query("SELECT * FROM patient_records WHERE id = ? AND user_id = ?", [
    id,
    ownerId,
  ]);
  return rows[0] || null;
}

async function patientUpsertFirestore(ownerId, id, b) {
  const ref = patientCollection(ownerId).doc(id);
  const existing = await ref.get();
  const doc = {
    id,
    user_id: ownerId,
    full_name: b.fullName,
    age: b.age,
    gender: b.gender || null,
    blood_group: b.bloodGroup || null,
    phone: b.phone || null,
    conditions: b.conditions || [],
    medications: b.medications || [],
    allergies: b.allergies || [],
    emergency_contact: b.emergencyContact || null,
    notes: b.notes || null,
    created_at: existing.exists ? existing.data().created_at : nowIso(),
    updated_at: nowIso(),
  };
  await ref.set(doc);
  return doc;
}

async function patientRemoveMysql(ownerId, id) {
  const [result] = await pool.query(
    "DELETE FROM patient_records WHERE id = ? AND user_id = ?",
    [id, ownerId]
  );
  return result.affectedRows > 0;
}

async function patientRemoveFirestore(ownerId, id) {
  const ref = patientCollection(ownerId).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return false;
  await ref.delete();
  return true;
}

export const patients = {
  async list(ownerId) {
    return isFirestoreConfigured() ? patientListFirestore(ownerId) : patientListMysql(ownerId);
  },
  async get(ownerId, id) {
    return isFirestoreConfigured() ? patientGetFirestore(ownerId, id) : patientGetMysql(ownerId, id);
  },
  async upsert(ownerId, id, body) {
    return isFirestoreConfigured()
      ? patientUpsertFirestore(ownerId, id, body)
      : patientUpsertMysql(ownerId, id, body);
  },
  async remove(ownerId, id) {
    return isFirestoreConfigured()
      ? patientRemoveFirestore(ownerId, id)
      : patientRemoveMysql(ownerId, id);
  },
};

/** Which store the routes are actually using — surfaced by /api/health. */
export function storageBackend() {
  return isFirestoreConfigured() ? "firestore" : "mysql";
}
