"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListingCell } from "@/components/listing-cell";
import { StatusBadge } from "@/components/status-badge";
import { EditRowDialog } from "@/components/edit-row-dialog";
import type { SheetRow } from "@/lib/types";

interface Props {
  rows: SheetRow[];
  year: string;
}

function formatCurrency(value: number | null): string {
  if (value === null) return "-";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  }).format(value);
}

export function DataTable({ rows: initialRows, year }: Props) {
  const [rows, setRows] = useState<SheetRow[]>(initialRows);
  const [editingRow, setEditingRow] = useState<SheetRow | null>(null);

  function handleRowUpdated(updatedRow: SheetRow) {
    setRows((prev) =>
      prev.map((r) => (r.rowIndex === updatedRow.rowIndex ? updatedRow : r))
    );
  }

  return (
    <>
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Listing</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Commission</TableHead>
              <TableHead className="text-right">LPK Share</TableHead>
              <TableHead>Sold To</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No data for this year.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.rowIndex}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setEditingRow(row)}
                >
                  <TableCell>
                    <ListingCell
                      title={row.listingTitle}
                      details={row.listingDetails}
                    />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-sm">{row.payment}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.commission)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(row.lpkShare)}
                  </TableCell>
                  <TableCell className="text-sm">{row.soldTo}</TableCell>
                  <TableCell className="text-sm">{row.organic}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <EditRowDialog
        row={editingRow}
        year={year}
        open={!!editingRow}
        onClose={() => setEditingRow(null)}
        onSaved={handleRowUpdated}
      />
    </>
  );
}
