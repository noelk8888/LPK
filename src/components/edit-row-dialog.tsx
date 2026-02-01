"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { SheetRow } from "@/lib/types";

interface Props {
  row: SheetRow | null;
  year: string;
  open: boolean;
  onClose: () => void;
  onSaved: (updatedRow: SheetRow) => void;
}

export function EditRowDialog({ row, year, open, onClose, onSaved }: Props) {
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (row) {
      setStatus(row.status);
      setPayment(row.payment);
      setNotes(row.notes);
    }
  }, [row]);

  if (!row) return null;

  async function updateField(column: "H" | "L" | "P", value: string) {
    const res = await fetch("/api/sheets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year,
        rowIndex: row!.rowIndex,
        column,
        value,
      }),
    });
    if (!res.ok) throw new Error("Failed to update");
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates: Promise<void>[] = [];

      if (status !== row!.status) {
        updates.push(updateField("H", status));
      }
      if (payment !== row!.payment) {
        updates.push(updateField("L", payment));
      }
      if (notes !== row!.notes) {
        updates.push(updateField("P", notes));
      }

      if (updates.length === 0) {
        onClose();
        return;
      }

      await Promise.all(updates);

      onSaved({
        ...row!,
        status,
        payment,
        notes,
      });

      toast.success("Changes saved to Google Sheets.");
      onClose();
    } catch {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="leading-snug">
            {row.listingTitle || "Edit Row"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Amount:{" "}
              {row.amount !== null
                ? `PHP ${row.amount.toLocaleString()}`
                : "-"}
            </p>
            <p>
              Commission:{" "}
              {row.commission !== null
                ? `PHP ${row.commission.toLocaleString()}`
                : "-"}
            </p>
            <p>Sold To: {row.soldTo || "-"}</p>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Sale">Sale</SelectItem>
                <SelectItem value="Lease">Lease</SelectItem>
                <SelectItem value="Sale/Lease">Sale/Lease</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Input
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              placeholder="Payment status"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
