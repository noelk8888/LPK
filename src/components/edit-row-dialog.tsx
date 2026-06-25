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
import { Trash2 } from "lucide-react";
import type { SheetRow } from "@/lib/types";

interface Props {
  row: SheetRow | null;
  year: string;
  open: boolean;
  mode?: "edit" | "add";
  onClose: () => void;
  onSaved: (updatedRow: SheetRow) => void;
  onDeleted?: (rowIndex: number) => void;
}

function formatNumberWithCommas(value: string): string {
  // Remove everything except digits and decimal point
  const clean = value.replace(/[^0-9.]/g, "");
  const parts = clean.split(".");
  // Format the integer part with commas
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (parts.length > 1) {
    parts[1] = parts[1].substring(0, 2);
    return `${parts[0]}.${parts[1]}`;
  }
  return parts[0];
}

function formatOnBlur(value: string): string {
  if (!value) return "";
  const clean = parseFloat(value.replace(/,/g, ""));
  if (isNaN(clean)) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(clean);
}

export function EditRowDialog({
  row,
  year,
  open,
  mode = "edit",
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [listing, setListing] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [commission, setCommission] = useState("");
  const [lpkShare, setLpkShare] = useState("");
  const [soldTo, setSoldTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdd = mode === "add";

  useEffect(() => {
    if (open) {
      if (row && mode === "edit") {
        setListing(row.listing);
        setStatus(row.status);
        setPayment(row.payment);
        setNotes(row.notes);
        setAmount(row.amount !== null ? formatOnBlur(String(row.amount)) : "");
        setCommission(row.commission !== null ? formatOnBlur(String(row.commission)) : "");
        setLpkShare(row.lpkShare !== null ? formatOnBlur(String(row.lpkShare)) : "");
        setSoldTo(row.soldTo);
      } else if (mode === "add") {
        setListing("");
        setStatus("");
        setPayment("");
        setNotes("");
        setAmount("");
        setCommission("");
        setLpkShare("");
        setSoldTo("");
      }
      setConfirmingDelete(false);
    }
  }, [row, open, mode]);

  if (mode === "edit" && !row) return null;

  async function updateField(
    column: "A" | "H" | "L" | "M" | "N" | "O" | "P" | "Q",
    value: string
  ) {
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
      if (isAdd) {
        // Create new row
        const res = await fetch("/api/sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            year,
            listing,
            status,
            payment,
            amount: amount.replace(/,/g, ""),
            commission: commission.replace(/,/g, ""),
            lpkShare: lpkShare.replace(/,/g, ""),
            notes,
            soldTo,
          }),
        });
        if (!res.ok) throw new Error("Failed to create row");
        const data = await res.json();

        const lines = listing.split("\n");
        onSaved({
          rowIndex: data.rowIndex,
          listing,
          listingTitle: lines[0]?.trim() || "",
          listingDetails: lines.slice(1).join("\n").trim(),
          status,
          payment,
          amount: amount !== "" ? parseFloat(amount.replace(/,/g, "")) : null,
          commission:
            commission !== "" ? parseFloat(commission.replace(/,/g, "")) : null,
          lpkShare:
            lpkShare !== "" ? parseFloat(lpkShare.replace(/,/g, "")) : null,
          notes,
          soldTo,
          organic: "",
          latLong: "",
        });

        toast.success("New row added to Google Sheets.");
        onClose();
      } else {
        // Update existing row
        const updates: Promise<void>[] = [];

        if (listing !== row!.listing) {
          updates.push(updateField("A", listing));
        }
        if (status !== row!.status) {
          updates.push(updateField("H", status));
        }
        if (payment !== row!.payment) {
          updates.push(updateField("L", payment));
        }
        const parsedAmount = amount !== "" ? parseFloat(amount.replace(/,/g, "")) : null;
        if (parsedAmount !== row!.amount) {
          updates.push(updateField("M", amount.replace(/,/g, "")));
        }
        const parsedCommission = commission !== "" ? parseFloat(commission.replace(/,/g, "")) : null;
        if (parsedCommission !== row!.commission) {
          updates.push(updateField("N", commission.replace(/,/g, "")));
        }
        const parsedLpkShare = lpkShare !== "" ? parseFloat(lpkShare.replace(/,/g, "")) : null;
        if (parsedLpkShare !== row!.lpkShare) {
          updates.push(updateField("O", lpkShare.replace(/,/g, "")));
        }
        if (notes !== row!.notes) {
          updates.push(updateField("P", notes));
        }
        if (soldTo !== row!.soldTo) {
          updates.push(updateField("Q", soldTo));
        }

        if (updates.length === 0) {
          onClose();
          return;
        }

        await Promise.all(updates);

        const lines = listing.split("\n");
        onSaved({
          ...row!,
          listing,
          listingTitle: lines[0]?.trim() || "",
          listingDetails: lines.slice(1).join("\n").trim(),
          status,
          payment,
          amount: amount !== "" ? parseFloat(amount.replace(/,/g, "")) : null,
          commission:
            commission !== "" ? parseFloat(commission.replace(/,/g, "")) : null,
          lpkShare:
            lpkShare !== "" ? parseFloat(lpkShare.replace(/,/g, "")) : null,
          notes,
          soldTo,
        });

        toast.success("Changes saved to Google Sheets.");
        onClose();
      }
    } catch {
      toast.error(
        isAdd ? "Failed to add row." : "Failed to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!row) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/sheets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, rowIndex: row.rowIndex }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      onDeleted?.(row.rowIndex);
      toast.success("Row deleted from Google Sheets.");
      onClose();
    } catch {
      toast.error("Failed to delete row.");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="leading-snug">
            {isAdd ? "Add New Listing" : row?.listingTitle || "Edit Row"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
            <Label className="pt-2 text-left">Listing Details</Label>
            <Textarea
              value={listing}
              onChange={(e) => setListing(e.target.value)}
              placeholder="Listing title and details..."
              rows={6}
              className="font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-left">Amount (PHP)</Label>
            <Input
              value={amount}
              onChange={(e) => setAmount(formatNumberWithCommas(e.target.value))}
              onBlur={(e) => setAmount(formatOnBlur(e.target.value))}
              placeholder="e.g. 10,000,000.00"
              type="text"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-left">Commission (PHP)</Label>
            <Input
              value={commission}
              onChange={(e) => setCommission(formatNumberWithCommas(e.target.value))}
              onBlur={(e) => setCommission(formatOnBlur(e.target.value))}
              placeholder="e.g. 300,000.00"
              type="text"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-left">LPK (PHP)</Label>
            <Input
              value={lpkShare}
              onChange={(e) => setLpkShare(formatNumberWithCommas(e.target.value))}
              onBlur={(e) => setLpkShare(formatOnBlur(e.target.value))}
              placeholder="e.g. 100,000.00"
              type="text"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-left">Sold To</Label>
            <Input
              value={soldTo}
              onChange={(e) => setSoldTo(e.target.value)}
              placeholder="Buyer name"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-left">Status</Label>
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

          <div className="grid grid-cols-[140px_1fr] items-center gap-4">
            <Label className="text-left">Payment Date</Label>
            <Input
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              placeholder="Payment date"
            />
          </div>

          <div className="grid grid-cols-[140px_1fr] items-start gap-4">
            <Label className="pt-2 text-left">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isAdd && (
            <div className="flex-1 flex justify-start">
              {confirmingDelete ? (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Confirm Delete"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : isAdd ? "Add Row" : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
