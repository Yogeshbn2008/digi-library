import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const name = await rl.question("Admin name: ");
const username = await rl.question("Username: ");
const password = await rl.question("Password: ");
rl.close();

const hash = await bcrypt.hash(password, 10);

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

await conn.execute(
  "INSERT INTO admins (name, username, password_hash) VALUES (?, ?, ?)",
  [name, username, hash]
);
await conn.end();
console.log("Admin created.");