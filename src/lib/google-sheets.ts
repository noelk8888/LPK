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
        details: row[COL.DETAILS] || "",
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

export async function getAvailableSheets(): Promise<string[]> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;
  const response = await sheets.spreadsheets.get({ spreadsheetId });
  return (response.data.sheets || [])
    .map((s) => s.properties?.title || "")
    .filter((title) => title && !title.startsWith("Sheet"));
}

export async function createYearSheet(newYear: string, templateYear = "2026"): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

  // Get template sheet ID
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const templateSheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === templateYear
  );
  if (templateSheet?.properties?.sheetId == null) {
    throw new Error(`Template sheet "${templateYear}" not found`);
  }
  const templateSheetId = templateSheet.properties.sheetId;

  // Duplicate the sheet with the new year as its title
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          duplicateSheet: {
            sourceSheetId: templateSheetId,
            newSheetName: newYear,
          },
        },
      ],
    },
  });

  // Clear all data rows (keep header row 1)
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${newYear}'!A2:BF1000`,
  });
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

export interface NewRowFields {
  listing?: string;
  status?: string;
  payment?: string;
  amount?: string;
  commission?: string;
  lpkShare?: string;
  notes?: string;
  soldTo?: string;
}

export async function appendRow(year: string, fields: NewRowFields): Promise<number> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

  // Build a sparse row array with values at correct column indices (up to Q = index 16)
  const row = new Array(17).fill("");
  row[COL.LISTING] = fields.listing || "";
  row[COL.STATUS] = fields.status || "";
  row[COL.PAYMENT] = fields.payment || "";
  row[COL.AMOUNT] = fields.amount || "";
  row[COL.COMMISSION] = fields.commission || "";
  row[COL.LPK_SHARE] = fields.lpkShare || "";
  row[COL.NOTES] = fields.notes || "";
  row[COL.SOLD_TO] = fields.soldTo || "";

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `'${year}'!A:Q`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  // Parse the row number from updatedRange like "'2026'!A5:Q5"
  const updatedRange = response.data.updates?.updatedRange || "";
  const match = updatedRange.match(/!A(\d+):/);
  return match ? parseInt(match[1]) : -1;
}

export async function deleteRow(year: string, rowIndex: number): Promise<void> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID!;

  // Get sheet ID
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === year);
  if (!sheet?.properties?.sheetId) {
    throw new Error(`Sheet "${year}" not found`);
  }
  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: "ROWS",
              startIndex: rowIndex - 1, // Convert 1-based to 0-based
              endIndex: rowIndex,
            },
          },
        },
      ],
    },
  });
}
