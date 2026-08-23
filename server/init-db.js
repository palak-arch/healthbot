import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initSchema(pool) {
  try {
    // Test connection first
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");

    // Read and execute schema
    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = schema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        // Ignore "already exists" errors
        if (!err.message.includes("already exists")) {
          console.error("Schema warning:", err.message);
        }
      }
    }

    console.log("✅ Database schema initialized");
    conn.release();
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
    console.error("   Will retry when first query is made");
  }
}
