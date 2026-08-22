import mysql from "mysql2/promise";

let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "healthbot",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: "utf8mb4",
    });

    // Test connection on startup
    _pool.getConnection()
      .then((conn) => {
        console.log("✅ MySQL connected successfully");
        conn.release();
      })
      .catch((err) => {
        console.error("❌ MySQL connection failed:", err.message);
        console.error("   Make sure MySQL is running and DB credentials are correct in server/.env");
      });
  }
  return _pool;
}

// Proxy that lazily creates the pool on first use
export default new Proxy({}, {
  get(_, prop) {
    return getPool()[prop];
  },
});
