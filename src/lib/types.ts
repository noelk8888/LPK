export interface SheetRow {
  rowIndex: number; // 1-based row number in the sheet (for write-back)
  listing: string; // Column A - raw multiline text
  listingTitle: string; // Parsed: first line of Column A
  listingDetails: string; // Parsed: remaining lines of Column A
  status: string; // Column H - "Sale", "Lease", or "Sale/Lease"
  payment: string; // Column L
  amount: number | null; // Column M - parsed as number
  commission: number | null; // Column N - parsed as number
  lpkShare: number | null; // Column O - parsed as number
  notes: string; // Column P
  soldTo: string; // Column Q
  organic: string; // Column R
  latLong: string; // Column BE
}

export interface YearSummary {
  year: string;
  totalSalesVolume: number; // Sum of Column M
  totalCommission: number; // Sum of Column N
  totalLpkShare: number; // Sum of Column O
  rowCount: number; // Number of data rows
  saleCount: number; // Rows where status includes "Sale"
  leaseCount: number; // Rows where status includes "Lease"
}

export interface SheetData {
  year: string;
  rows: SheetRow[];
  summary: YearSummary;
}

export interface CellUpdate {
  year: string; // Which sheet tab
  rowIndex: number; // 1-based row number
  column: "A" | "H" | "L" | "M" | "N" | "P" | "Q"; // Which column to update
  value: string; // New value
}
