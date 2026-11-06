import mysql from "mysql2/promise";

const globalForDb = global as typeof globalThis & { pool?: mysql.Pool };

function sslOptions() {
  if (process.env.DB_SSL !== "true") return undefined;

  // The certificate text may arrive with literal \n sequences from some hosts
  const ca = process.env.DB_CA?.replace(/\\n/g, "\n");

  if (ca) return { ca, rejectUnauthorized: true }; // encrypted AND verified
  return { rejectUnauthorized: false }; // encrypted only (fallback)
}

export const pool =
  globalForDb.pool ??
  mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 3,
    ssl: sslOptions(),
  });

globalForDb.pool = pool;