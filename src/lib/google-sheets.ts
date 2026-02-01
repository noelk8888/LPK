import { google } from "googleapis";
import { COL } from "./constants";
import type { SheetRow, YearSummary, SheetData, CellUpdate } from "./types";

function getAuthClient() {
  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: "v4", auth });
}

// Parse a currency/number string like "$1,234,567.89" or "1234567.89" to a number
function parseCurrency(value: string | undefined | null): number | null {
  if (!value) return null;
  const cleaned = value.replace(/[^0-9.\-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// Parse Column A: first line = title, rest = details
function parseListingText(raw: string): { title: string; details: string } {
  if (!raw) return { title: "", details: "" };
  const lines = raw.split("\n");
  return {
    title: lines[0]?.trim() || "",
    details: lines.slice(1).join("\n").trim(),
  };
}

export async function fetchSheetData(year: string): Promise<SheetData> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

  const range = `'${year}'!A1:BE1000`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const rawRows = response.data.values || [];

  // Skip header row (index 0). Data starts at row 2 in the sheet.
  const dataRows = rawRows.slice(1);

  const rows: SheetRow[] = dataRows
    .map((row, idx) => {
      const listing = row[COL.LISTING] || "";
      const { title, details } = parseListingText(listing);
      return {
        rowIndex: idx + 2, // +1 for 1-indexing, +1 for skipped header
        listing,
        listingTitle: title,
        listingDetails: details,
        status: row[COL.STATUS] || "",
        payment: row[COL.PAYMENT] || "",
        amount: parseCurrency(row[COL.AMOUNT]),
        commission: parseCurrency(row[COL.COMMISSION]),
        lpkShare: parseCurrency(row[COL.LPK_SHARE]),
        notes: row[COL.NOTES] || "",
        soldTo: row[COL.SOLD_TO] || "",
        organic: row[COL.ORGANIC] || "",
        latLong: row[COL.LAT_LONG] || "",
      };
    })
    .filter((row) => row.listing.trim() !== "");

  const summary: YearSummary = {
    year,
    totalSalesVolume: rows.reduce((sum, r) => sum + (r.amount || 0), 0),
    totalCommission: rows.reduce((sum, r) => sum + (r.commission || 0), 0),
    totalLpkShare: rows.reduce((sum, r) => sum + (r.lpkShare || 0), 0),
    rowCount: rows.length,
    saleCount: rows.filter((r) =>
      r.status.toLowerCase().includes("sale")
    ).length,
    leaseCount: rows.filter((r) =>
      r.status.toLowerCase().includes("lease")
    ).length,
  };

  return { year, rows, summary };
}

export async function updateCell(update: CellUpdate): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

  const range = `'${update.year}'!${update.column}${update.rowIndex}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[update.value]],
    },
  });
}
