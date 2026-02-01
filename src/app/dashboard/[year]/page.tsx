import { fetchSheetData } from "@/lib/google-sheets";
import { AVAILABLE_YEARS } from "@/lib/constants";
import { notFound } from "next/navigation";
import { SummaryCards } from "@/components/summary-cards";
import { DataTable } from "@/components/data-table";

interface Props {
  params: Promise<{ year: string }>;
}

export default async function YearDashboardPage({ params }: Props) {
  const { year } = await params;

  if (
    !AVAILABLE_YEARS.includes(year as (typeof AVAILABLE_YEARS)[number])
  ) {
    notFound();
  }

  const data = await fetchSheetData(year);

  return (
    <div className="space-y-6">
      <SummaryCards summary={data.summary} />
      <DataTable rows={data.rows} year={year} />
    </div>
  );
}

export const revalidate = 60;
