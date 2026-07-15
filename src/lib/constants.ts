// Zero-based column indices matching the Google Sheet
export const COL = {
  LISTING: 0, // A
  DETAILS: 1, // B
  STATUS: 7, // H
  PAYMENT: 11, // L
  AMOUNT: 12, // M
  COMMISSION: 13, // N
  LPK_SHARE: 14, // O
  NOTES: 15, // P
  SOLD_TO: 16, // Q
  ORGANIC: 17, // R
  LAT_LONG: 56, // BE
} as const;

// Column letters for writing back to Google Sheets
export const COL_LETTER = {
  STATUS: "H",
  PAYMENT: "L",
  AMOUNT: "M",
  COMMISSION: "N",
  LPK_SHARE: "O",
  NOTES: "P",
  SOLD_TO: "Q",
} as const;

export const AVAILABLE_YEARS = ["2023", "2024", "2025", "2026"] as const;
export type YearTab = (typeof AVAILABLE_YEARS)[number];
