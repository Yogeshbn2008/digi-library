import mysql from "mysql2/promise";

const globalForDb = global as typeof globalThis & { pool?: mysql.Pool };

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
    ssl:
      process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

globalForDb.pool = pool;