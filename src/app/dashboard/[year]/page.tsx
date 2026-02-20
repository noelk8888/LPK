import { fetchSheetData } from "@/lib/google-sheets";
import { notFound } from "next/navigation";
import { SummaryCards } from "@/components/summary-cards";
import { DataTable } from "@/components/data-table";

interface Props {
  params: Promise<{ year: string }>;
}

export default async function YearDashboardPage({ params }: Props) {
  const { year } = await params;

  if (!/^\d{4}$/.test(year)) {
    notFound();
  }

  let data;
  try {
    data = await fetchSheetData(year);
  } catch {
    // Sheet doesn't exist or API error
    notFound();
  }

  return (
    <div className="space-y-6">
      <SummaryCards summary={data.summary} />
      <DataTable rows={data.rows} year={year} />
    </div>
  );
}
