import { withSupabase } from "npm:@supabase/server@1";
import * as XLSX from "npm:xlsx@0.18.5";

const MAX_BASE64_LENGTH = 5_000_000;
const MAX_ROWS = 2_000;

function toText(value: unknown): string | null {
  if (value == null) return null;
  return String(value).trim() || null;
}

function toInt(value: unknown): number | null {
  if (value == null || value === "") return null;

  const num = Number(value);
  return Number.isSafeInteger(num) ? num : null;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
      const { fileBase64 } = await req.json();

      if (
        typeof fileBase64 !== "string" ||
        fileBase64.length === 0 ||
        fileBase64.length > MAX_BASE64_LENGTH
      ) {
        return Response.json({ error: "Invalid or oversized file" }, { status: 400 });
      }

      const bytes = Uint8Array.from(atob(fileBase64), (char) => char.charCodeAt(0));

      const workbook = XLSX.read(bytes, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error("Workbook contains no sheets");
      }

      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });

      if (raw.length > MAX_ROWS) {
        return Response.json({ error: "Too many rows" }, { status: 413 });
      }

      const rows = raw
        .map((row) => {
          const normalized: Record<string, unknown> = {};

          for (const [key, value] of Object.entries(row)) {
            normalized[key.trim().toLowerCase().replace(/\s+/g, "_")] = value;
          }

          return {
            name: toText(normalized.name),
            address: toText(normalized.address),
            city: toText(normalized.city),
            country: toText(normalized.country),
            floors: toInt(normalized.floors),
            year_built: toInt(normalized.year_built),
          };
        })
        .filter((row): row is typeof row & { name: string } => row.name !== null);

      const skipped = raw.length - rows.length;

      if (rows.length === 0) {
        return Response.json({
          inserted: 0,
          skipped,
        });
      }

      const { error } = await ctx.supabase.from("buildings").insert(rows);

      if (error) throw error;

      return Response.json({
        inserted: rows.length,
        skipped,
      });
    } catch (error) {
      console.error("Import error:", error);

      return Response.json({ error: "Unable to import the file" }, { status: 400 });
    }
  }),
};
