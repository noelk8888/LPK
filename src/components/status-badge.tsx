import { Badge } from "@/components/ui/badge";

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  if (!status)
    return <span className="text-muted-foreground text-sm">-</span>;

  const lower = status.toLowerCase();

  if (lower === "lease") {
    return (
      <Badge className="bg-blue-800 text-white hover:bg-blue-900 border-blue-800">
        {status}
      </Badge>
    );
  }

  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  if (lower === "sale") variant = "default";
  else if (lower === "sale/lease") variant = "destructive";

  return <Badge variant={variant}>{status}</Badge>;
}
