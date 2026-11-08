import { RowDataPacket } from "mysql2";
import { pool } from "./db";

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_USERNAME = 5;
const MAX_FAILS_PER_IP = 30;

export async function isBlocked(
  username: string,
  ip: string,
  maxPerIp = MAX_FAILS_PER_IP
) {
  const [rows] = await pool.query<
    (RowDataPacket & { by_user: string | null; by_ip: string | null })[]
  >(
    `SELECT SUM(username = ?) AS by_user, SUM(ip = ?) AS by_ip
     FROM login_attempts
     WHERE success = 0
       AND attempted_at >= NOW() - INTERVAL ${WINDOW_MINUTES} MINUTE`,
    [username, ip]
  );
  const byUser = Number(rows[0].by_user ?? 0);
  const byIp = Number(rows[0].by_ip ?? 0);
   return byUser >= MAX_FAILS_PER_USERNAME || byIp >= maxPerIp;
}

export async function recordAttempt(username: string, ip: string, success: boolean) {
  await pool.query(
    "INSERT INTO login_attempts (username, ip, success) VALUES (?, ?, ?)",
    [username, ip, success ? 1 : 0]
  );
  // Now and then, remove old rows so the table stays small
  if (Math.random() < 0.02) {
    await pool.query(
      "DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL 30 DAY"
    );
  }
}

export async function clearFailures(username: string) {
  await pool.query(
    "DELETE FROM login_attempts WHERE username = ? AND success = 0",
    [username]
  );
}