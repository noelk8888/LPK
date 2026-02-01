import { redirect } from "next/navigation";

export default function DashboardPage() {
  const currentYear = new Date().getFullYear().toString();
  redirect(`/dashboard/${currentYear}`);
}
