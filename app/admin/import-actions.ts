"use server";

import Papa from "papaparse";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2";
import { pool } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const REQUIRED = ["book_code", "title", "category"];
const STATUSES = ["available", "lost", "unverified"];

type CsvRow = Record<string, string | undefined>;

const to = (key: "msg" | "error", text: string) =>
  `/admin/import?${key}=${encodeURIComponent(text)}`;

export async function importBooks(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(to("error", "Choose a CSV file first."));
  }
  if (file.size > 2 * 1024 * 1024) {
    redirect(to("error", "File is too large (limit 2 MB)."));
  }

  const text = (await file.text()).replace(/^\uFEFF/, ""); // strip BOM
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const headers = parsed.meta.fields ?? [];
  const missing = REQUIRED.filter((h) => !headers.includes(h));
  if (missing.length) {
    redirect(to("error", `Missing column(s): ${missing.join(", ")}. Is this the right file?`));
  }

  const errors: string[] = [];
  const rows: (string | number | null)[][] = [];
  const seen = new Set<string>();

  parsed.data.forEach((r, i) => {
    const line = i + 2; // line 1 is the header
    const code = (r.book_code ?? "").trim();
    const title = (r.title ?? "").trim();
    const author = (r.author ?? "").trim() || null;
    const category = (r.category ?? "").trim();
    const priceRaw = (r.price ?? "").trim();
    const donatedRaw = (r.donated ?? "").trim().toLowerCase();
    const status = (r.status ?? "").trim().toLowerCase() || "available";
    const remarks = (r.remarks ?? "").trim() || null;

    if (!code || !title || !category) {
      errors.push(`Line ${line}: book_code, title and category are required.`);
      return;
    }
    if (
      code.length > 30 || title.length > 255 || category.length > 100 ||
      (author && author.length > 255) || (remarks && remarks.length > 255)
    ) {
      errors.push(`Line ${line} (${code}): a value is too long.`);
      return;
    }
    if (!STATUSES.includes(status)) {
      errors.push(`Line ${line} (${code}): status must be available, lost or unverified.`);
      return;
    }
    let price: number | null = null;
    if (priceRaw) {
      price = Number(priceRaw);
      if (!Number.isFinite(price) || price < 0 || price > 99999) {
        errors.push(`Line ${line} (${code}): invalid price.`);
        return;
      }
    }
    const key = code.toUpperCase();
    if (seen.has(key)) {
      errors.push(`Line ${line}: code ${code} appears twice in the file.`);
      return;
    }
    seen.add(key);

    const donated = ["1", "yes", "y", "true"].includes(donatedRaw) ? 1 : 0;
    rows.push([code, title, author, category, price, donated, status, remarks]);
  });

  if (errors.length) {
    const shown = errors.slice(0, 8).join(" | ");
    redirect(to("error", `Nothing was imported. ${errors.length} problem(s): ${shown}`));
  }
  if (rows.length === 0) redirect(to("error", "The file has no book rows."));

  // Skip codes that already exist, so uploading the same file twice is safe
  const [existing] = await pool.query<RowDataPacket[]>(
    "SELECT book_code FROM books WHERE book_code IN (?)",
    [rows.map((r) => r[0])]
  );
  const have = new Set(existing.map((e) => String(e.book_code).toUpperCase()));
  const fresh = rows.filter((r) => !have.has(String(r[0]).toUpperCase()));

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < fresh.length; i += 500) {
      await conn.query(
        `INSERT INTO books
           (book_code, title, author, genre, price, donated, status, remarks)
         VALUES ?`,
        [fresh.slice(i, i + 500)]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(
    to("msg", `Imported ${fresh.length} books. Skipped ${rows.length - fresh.length} that already exist.`)
  );
}