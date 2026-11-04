import { RowDataPacket } from "mysql2";
import { pool } from "./db";

export interface AdminRow extends RowDataPacket {
  id: number;
  name: string;
  username: string;
  is_active: number;
}

export async function getAdmins() {
  const [rows] = await pool.query<AdminRow[]>(
    "SELECT id, name, username, is_active FROM admins ORDER BY id"
  );
  return rows;
}