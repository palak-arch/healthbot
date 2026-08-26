import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function initSchema(pool) {
  try {
    // Test connection first
    const conn = await pool.getConnection();
    console.log("✅ MySQL connected successfully");

    // Try multiple paths for schema.sql (Railway compatibility)
    const possiblePaths = [
      join(__dirname, "schema.sql"),           // server/schema.sql
      join(__dirname, "..", "server", "schema.sql"),  // ../server/schema.sql
      join(process.cwd(), "server", "schema.sql"),    // cwd/server/schema.sql
      join(process.cwd(), "schema.sql"),              // cwd/schema.sql
    ];

    let schema = null;
    for (const path of possiblePaths) {
      if (existsSync(path)) {
        schema = readFileSync(path, "utf-8");
        console.log("📄 Found schema at:", path);
        break;
      }
    }

    if (!schema) {
      console.warn("⚠️ schema.sql not found - creating tables manually");
      // Create tables manually if schema file not found
      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(36) DEFAULT NULL,
          user_message TEXT NOT NULL,
          bot_response TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vaccination_records (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) DEFAULT NULL,
          vaccine_name VARCHAR(255) NOT NULL,
          date_administered DATE DEFAULT NULL,
          scheduled_date DATE DEFAULT NULL,
          status ENUM('completed', 'scheduled', 'overdue') DEFAULT 'scheduled',
          notes TEXT DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_scheduled_date (scheduled_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Database schema created manually");
      conn.release();
      return;
    }

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
