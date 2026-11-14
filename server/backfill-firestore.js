#!/usr/bin/env node
// One-time copy of vaccination_records and patient_records from MySQL into
// Firestore, for the collections that server/data-layer.js has already moved.
//
//   node server/backfill-firestore.js --dry-run    # show what would be written
//   node server/backfill-firestore.js              # write, skipping existing docs
//   node server/backfill-firestore.js --overwrite  # replace documents that exist
//
// Safe to re-run: without --overwrite, documents that already exist are left
// alone, so an interrupted run can simply be started again.
//
// Rows with a NULL user_id are skipped and counted — they are not attributable to
// anyone, and guessing an owner for health data is worse than leaving it behind.

import process from "node:process";
import { pathToFileURL } from "node:url";
import pool from "./db.js";
import { getFirestoreDb, isFirestoreConfigured } from "./firestore.js";

const BATCH_SIZE = 400; // Firestore allows 500 writes per batch; stay under it.
const VACCINATIONS = "vaccination_records";

// ─── Row → document conversion ────────────────────────────────
// mysql2 hands back Date objects for DATE/TIMESTAMP columns and already-parsed
// values for JSON columns, but older rows and other drivers may return strings.
// These helpers accept either so a mixed table still copies cleanly.

export function toDateString(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function toIsoString(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function vaccinationDoc(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    vaccine_name: row.vaccine_name,
    scheduled_date: toDateString(row.scheduled_date),
    date_administered: toDateString(row.date_administered),
    status: row.status || "scheduled",
    notes: row.notes ?? null,
    created_at: toIsoString(row.created_at),
  };
}

export function patientDoc(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    full_name: row.full_name,
    age: row.age,
    gender: row.gender ?? null,
    blood_group: row.blood_group ?? null,
    phone: row.phone ?? null,
    conditions: toArray(row.conditions),
    medications: toArray(row.medications),
    allergies: toArray(row.allergies),
    emergency_contact: row.emergency_contact ?? null,
    notes: row.notes ?? null,
    created_at: toIsoString(row.created_at),
    updated_at: toIsoString(row.updated_at),
  };
}

export function chatMessageDoc(row) {
  return {
    user_id: row.user_id,
    user_message: row.user_message,
    bot_response: row.bot_response,
    created_at: toIsoString(row.created_at),
  };
}

// ─── Counting / writing helpers ───────────────────────────────

function emptyStats() {
  return { read: 0, written: 0, skippedExisting: 0, skippedNoOwner: 0 };
}

async function existingIds(collectionRef) {
  // listDocuments() lists references without reading document contents.
  const refs = await collectionRef.listDocuments();
  return new Set(refs.map((ref) => ref.id));
}

async function commitInBatches(db, entries, stats) {
  let batch = db.batch();
  let pending = 0;

  for (const { ref, data } of entries) {
    batch.set(ref, data);
    pending += 1;
    stats.written += 1;
    if (pending === BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
}

async function countDocs(collectionRef) {
  const snap = await collectionRef.count().get();
  return snap.data().count;
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has("--dry-run");
  const overwrite = args.has("--overwrite");

  if (!isFirestoreConfigured()) {
    console.error(
      "Firestore is not configured. Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS first."
    );
    process.exit(1);
  }

  const db = getFirestoreDb();
  console.log(
    `Backfill starting${dryRun ? " (dry run — nothing will be written)" : ""}` +
      `${overwrite ? " with --overwrite" : ", existing documents preserved"}`
  );

  // ── Vaccinations ──
  const [vaccRows] = await pool.query("SELECT * FROM vaccination_records");
  const vaccStats = emptyStats();
  vaccStats.read = vaccRows.length;

  const vaccCollection = db.collection(VACCINATIONS);
  // Even in a dry run, look at what already exists so the report is accurate.
  const haveVacc = overwrite ? new Set() : await existingIds(vaccCollection);
  const vaccWrites = [];

  for (const row of vaccRows) {
    if (!row.user_id) {
      vaccStats.skippedNoOwner += 1;
      continue;
    }
    if (haveVacc.has(row.id) && !overwrite) {
      vaccStats.skippedExisting += 1;
      continue;
    }
    vaccWrites.push({ ref: vaccCollection.doc(row.id), data: vaccinationDoc(row) });
  }

  // ── Patient records ──
  const [patientRows] = await pool.query("SELECT * FROM patient_records");
  const patientStats = emptyStats();
  patientStats.read = patientRows.length;

  const byOwner = new Map();
  for (const row of patientRows) {
    if (!row.user_id) {
      patientStats.skippedNoOwner += 1;
      continue;
    }
    if (!byOwner.has(row.user_id)) byOwner.set(row.user_id, []);
    byOwner.get(row.user_id).push(row);
  }

  const patientWrites = [];
  for (const [userId, rows] of byOwner) {
    const collectionRef = db.collection("users").doc(userId).collection("patients");
    const have = overwrite ? new Set() : await existingIds(collectionRef);
    for (const row of rows) {
      if (have.has(row.id) && !overwrite) {
        patientStats.skippedExisting += 1;
        continue;
      }
      patientWrites.push({ ref: collectionRef.doc(row.id), data: patientDoc(row) });
    }
  }

  // ── Chat messages ──
  const [chatRows] = await pool.query("SELECT * FROM chat_messages");
  const chatStats = emptyStats();
  chatStats.read = chatRows.length;

  const chatCollection = db.collection("chat_messages");
  const haveChat = overwrite ? new Set() : await existingIds(chatCollection);
  const chatWrites = [];

  for (const row of chatRows) {
    // Rows written before history was scoped to a session have no owner.
    if (!row.user_id) {
      chatStats.skippedNoOwner += 1;
      continue;
    }
    const id = String(row.id);
    if (haveChat.has(id) && !overwrite) {
      chatStats.skippedExisting += 1;
      continue;
    }
    chatWrites.push({ ref: chatCollection.doc(id), data: chatMessageDoc(row) });
  }

  if (dryRun) {
    console.log("\nDry run — planned writes:");
    console.log(`  vaccinations: ${vaccWrites.length}`);
    console.log(`  patient records: ${patientWrites.length}`);
    console.log(`  chat messages: ${chatWrites.length}`);
    console.log(
      `  skipped (already in Firestore): ${vaccStats.skippedExisting + patientStats.skippedExisting + chatStats.skippedExisting}`
    );
    console.log(
      `  skipped (no user_id): ${vaccStats.skippedNoOwner + patientStats.skippedNoOwner + chatStats.skippedNoOwner}`
    );
    console.log("\nRe-run without --dry-run to write.");
    return;
  }

  await commitInBatches(db, vaccWrites, vaccStats);
  await commitInBatches(db, patientWrites, patientStats);
  await commitInBatches(db, chatWrites, chatStats);

  // Verify against the source counts rather than trusting the write loop.
  const vaccInDb = await countDocs(vaccCollection);
  let patientsInDb = 0;
  for (const userId of byOwner.keys()) {
    patientsInDb += await countDocs(db.collection("users").doc(userId).collection("patients"));
  }
  const chatInDb = await countDocs(chatCollection);

  const report = (label, stats, source, destination) => {
    console.log(`\n${label}`);
    console.log(`  rows read:            ${source}`);
    console.log(`  written this run:     ${stats.written}`);
    console.log(`  already present:      ${stats.skippedExisting}`);
    console.log(`  skipped (no user_id): ${stats.skippedNoOwner}`);
    console.log(`  documents in Firestore: ${destination}`);
  };

  report("Vaccinations", vaccStats, vaccStats.read, vaccInDb);
  report("Patient records", patientStats, patientStats.read, patientsInDb);
  report("Chat messages", chatStats, chatStats.read, chatInDb);

  const expectedVacc = vaccStats.read - vaccStats.skippedNoOwner;
  const expectedPatients = patientStats.read - patientStats.skippedNoOwner;
  const expectedChat = chatStats.read - chatStats.skippedNoOwner;
  const ok =
    vaccInDb >= expectedVacc && patientsInDb >= expectedPatients && chatInDb >= expectedChat;

  console.log(ok ? "\n✅ Counts match the source rows." : "\n⚠️ Firestore holds fewer documents than expected — re-run to finish.");
  if (!ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then(() => pool.end())
    .catch(async (error) => {
      console.error("Backfill failed:", error.message);
      try {
        await pool.end();
      } catch {
        /* ignore */
      }
      process.exit(1);
    });
}
