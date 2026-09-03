import { YearSelector } from "@/components/year-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-yellow-50 dark:bg-background">
      <header className="border-b bg-white dark:bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">
            <a
              href="https://docs.google.com/spreadsheets/d/1Wk-hWIPaQvtrbHvHE4miy4u16zzSar4BETBg1itj_Gg/edit?gid=672080172#gid=672080172"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-blue-600"
            >
              Real
            </a>{" "}
            Estate Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <YearSelector />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
