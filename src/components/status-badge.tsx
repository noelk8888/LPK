import { Badge } from "@/components/ui/badge";

interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  if (!status)
    return <span className="text-muted-foreground text-sm">-</span>;

  const lower = status.toLowerCase();
  let variant: "default" | "secondary" | "destructive" | "outline" = "outline";

  if (lower === "sale") variant = "default";
  else if (lower === "lease") variant = "secondary";
  else if (lower === "sale/lease") variant = "destructive";

  return <Badge variant={variant}>{status}</Badge>;
}
