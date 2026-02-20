"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { AVAILABLE_YEARS } from "@/lib/constants";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function YearSelector() {
  const router = useRouter();
  const pathname = usePathname();

  const currentYear =
    pathname.split("/").pop() || new Date().getFullYear().toString();

  const [years, setYears] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newYear, setNewYear] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    // Set static fallback immediately (client-only, avoids SSR hydration mismatch)
    setYears([...AVAILABLE_YEARS]);
    // Then fetch actual tabs from the sheet
    fetch("/api/sheets/tabs")
      .then((r) => r.json())
      .then((data) => {
        if (data.tabs?.length) setYears(data.tabs);
      })
      .catch(() => {});
  }, []);

  async function handleCreate() {
    if (!/^\d{4}$/.test(newYear)) {
      toast.error("Please enter a valid 4-digit year.");
      return;
    }
    if (years.includes(newYear)) {
      toast.error(`Sheet "${newYear}" already exists.`);
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/sheets/tabs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: newYear }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      setYears((prev) => [...prev, newYear].sort());
      toast.success(`Sheet "${newYear}" created.`);
      setDialogOpen(false);
      setNewYear("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create sheet.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <Tabs
          value={currentYear}
          onValueChange={(year) => router.push(`/dashboard/${year}`)}
        >
          <TabsList>
            {years.map((year) => (
              <TabsTrigger key={year} value={year}>
                {year}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setDialogOpen(true)}
          title="Add new year"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>Add New Year Sheet</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>Year</Label>
            <Input
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="e.g. 2027"
              maxLength={4}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <p className="text-xs text-muted-foreground">
              Copies the structure of the 2026 sheet.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
