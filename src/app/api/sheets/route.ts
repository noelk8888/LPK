import { NextRequest, NextResponse } from "next/server";
import { fetchSheetData, updateCell } from "@/lib/google-sheets";
import { AVAILABLE_YEARS } from "@/lib/constants";
import type { CellUpdate } from "@/lib/types";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  if (!year || !AVAILABLE_YEARS.includes(year as (typeof AVAILABLE_YEARS)[number])) {
    return NextResponse.json(
      { error: `Invalid year. Must be one of: ${AVAILABLE_YEARS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const data = await fetchSheetData(year);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch sheet data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from Google Sheets" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: CellUpdate = await request.json();

    if (!body.year || !AVAILABLE_YEARS.includes(body.year as (typeof AVAILABLE_YEARS)[number])) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    if (!body.rowIndex || body.rowIndex < 2) {
      return NextResponse.json(
        { error: "Invalid row index" },
        { status: 400 }
      );
    }
    if (!["H", "L", "P"].includes(body.column)) {
      return NextResponse.json(
        {
          error:
            "Can only update columns H (Status), L (Payment), or P (Notes)",
        },
        { status: 400 }
      );
    }

    await updateCell(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update cell:", error);
    return NextResponse.json(
      { error: "Failed to update Google Sheet" },
      { status: 500 }
    );
  }
}
