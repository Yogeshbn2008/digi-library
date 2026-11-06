import fs from "node:fs";
import mysql from "mysql2/promise";

const caPath = process.env.DB_CA_PATH;
const verified = Boolean(caPath);

const ssl =
  process.env.DB_SSL === "true"
    ? verified
      ? { ca: fs.readFileSync(caPath, "utf8"), rejectUnauthorized: true }
      : { rejectUnauthorized: false }
    : undefined;

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl,
});

const [rows] = await conn.query("SELECT COUNT(*) AS n FROM books");
console.log("Connected. Books:", rows[0].n, "| certificate verified:", verified);
await conn.end();