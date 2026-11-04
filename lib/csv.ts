type Cell = string | number | Date | null | undefined;

function formatCell(value: Cell): string {
  if (value === null || value === undefined) return "";

  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  let text = String(value);

  // Stop spreadsheet programs from running text that starts like a formula
  if (typeof value === "string" && /^[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  // Quote the cell if it contains a comma, a quote or a line break
  if (/[",\r\n]/.test(text)) {
    text = '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

export function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(formatCell).join(",")).join("\r\n") + "\r\n";
}