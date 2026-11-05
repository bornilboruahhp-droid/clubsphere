import { conflict } from "@/lib/api/errors";

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => unknown;
}

/**
 * Escapes quotes, commas, and newlines according to RFC 4180.
 * Neutralizes spreadsheet formula injection by prefixing '=' | '+' | '-' | '@' with a single quote.
 */
export function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Prevent spreadsheet formula injection by prefixing a single quote
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // If the cell contains quotes, commas, or newlines, escape internal quotes and wrap in double quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts a typed array of row objects into a RFC 4180 CSV string with a UTF-8 BOM.
 * Throws 409 Conflict if row count exceeds 10,000.
 */
export function generateCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  if (rows.length > 10000) {
    throw conflict(
      "Export exceeds the maximum limit of 10,000 rows. Please filter the dataset."
    );
  }

  const headerLine = columns.map((col) => sanitizeCell(col.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => sanitizeCell(col.accessor(row))).join(",")
  );

  // Emit UTF-8 BOM (\uFEFF) so Excel and spreadsheet applications auto-detect UTF-8
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
}

/**
 * Returns a NextResponse/Response configured with text/csv content type and attachment headers.
 */
export function createCsvResponse(csvContent: string, filename: string): Response {
  // Ensure safe filename without header-breaking characters
  const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, "_");

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

/**
 * Formats a Date object into YYYY-MM-DD for filename conventions.
 */
export function formatFilenameDate(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
