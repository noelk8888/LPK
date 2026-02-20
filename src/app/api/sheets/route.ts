import { NextRequest, NextResponse } from "next/server";
import { fetchSheetData, updateCell, appendRow, deleteRow } from "@/lib/google-sheets";
import type { CellUpdate } from "@/lib/types";

function isValidYear(year: string | null): year is string {
  return !!year && /^\d{4}$/.test(year);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");

  if (!isValidYear(year)) {
    return NextResponse.json(
      { error: "Invalid year. Must be a 4-digit number." },
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

    if (!isValidYear(body.year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    if (!body.rowIndex || body.rowIndex < 2) {
      return NextResponse.json(
        { error: "Invalid row index" },
        { status: 400 }
      );
    }
    if (!["A", "H", "L", "M", "N", "P", "Q"].includes(body.column)) {
      return NextResponse.json(
        {
          error:
            "Can only update columns H (Status), L (Payment), M (Amount), N (Commission), P (Notes), or Q (Sold To)",
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidYear(body.year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const rowIndex = await appendRow(body.year, {
      listing: body.listing,
      status: body.status,
      payment: body.payment,
      amount: body.amount,
      commission: body.commission,
      notes: body.notes,
      soldTo: body.soldTo,
    });

    return NextResponse.json({ success: true, rowIndex });
  } catch (error) {
    console.error("Failed to add row:", error);
    return NextResponse.json(
      { error: "Failed to add row to Google Sheet" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidYear(body.year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }
    if (!body.rowIndex || body.rowIndex < 2) {
      return NextResponse.json({ error: "Invalid row index" }, { status: 400 });
    }

    await deleteRow(body.year, body.rowIndex);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete row:", error);
    return NextResponse.json(
      { error: "Failed to delete row from Google Sheet" },
      { status: 500 }
    );
  }
}
