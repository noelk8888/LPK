"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AVAILABLE_YEARS } from "@/lib/constants";

export function YearSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const currentYear =
    pathname.split("/").pop() || new Date().getFullYear().toString();

  return (
    <Tabs
      value={currentYear}
      onValueChange={(year) => router.push(`/dashboard/${year}`)}
    >
      <TabsList>
        {AVAILABLE_YEARS.map((year) => (
          <TabsTrigger key={year} value={year}>
            {year}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
