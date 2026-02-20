import { NextRequest, NextResponse } from "next/server";
import { getAvailableSheets, createYearSheet } from "@/lib/google-sheets";

export async function GET() {
  try {
    const tabs = await getAvailableSheets();
    return NextResponse.json({ tabs });
  } catch (error) {
    console.error("Failed to fetch sheet tabs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sheet tabs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { year } = await request.json();

    if (!year || !/^\d{4}$/.test(year)) {
      return NextResponse.json(
        { error: "Invalid year. Must be a 4-digit number." },
        { status: 400 }
      );
    }

    await createYearSheet(year);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create sheet:", error);
    return NextResponse.json(
      { error: "Failed to create sheet" },
      { status: 500 }
    );
  }
}
