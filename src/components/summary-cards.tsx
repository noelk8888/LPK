import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { YearSummary } from "@/lib/types";

interface Props {
  summary: YearSummary;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function SummaryCards({ summary }: Props) {
  const cards = [
    {
      title: "Total Sales Volume",
      value: formatCurrency(summary.totalSalesVolume),
      subtitle: `${summary.rowCount} transactions`,
    },
    {
      title: "Total Commission",
      value: formatCurrency(summary.totalCommission),
      subtitle: `${summary.saleCount} sales, ${summary.leaseCount} leases`,
    },
    {
      title: "LPK",
      value: formatCurrency(summary.totalLpkShare),
      subtitle: "Your earnings",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-lg text-muted-foreground mt-1">
              {card.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
