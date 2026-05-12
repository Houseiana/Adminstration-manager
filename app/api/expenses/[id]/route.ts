import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toExpense } from "@/lib/api-helpers";
import type { ExpenseEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXP_COLUMNS = `
  id, category, year, month, amount,
  vendor_name, supplier_name, supplier_phone, supplier_address,
  authorized_by, expense_date,
  invoice_number, has_invoice, no_invoice_reason,
  notes, created_at, updated_at
`;

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  let body: Partial<ExpenseEntry>;
  try {
    body = (await req.json()) as Partial<ExpenseEntry>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  return withDb(async (c) => {
    const { rows: old } = await c.query(
      `SELECT ${EXP_COLUMNS} FROM expenses WHERE id = $1`,
      [id]
    );
    if (old.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const o = toExpense(old[0]);
    const hasInvoice =
      body.hasInvoice === undefined ? o.hasInvoice : body.hasInvoice !== false;

    const { rows } = await c.query(
      `UPDATE expenses SET
         category = $2, year = $3, month = $4, amount = $5,
         vendor_name = $6,
         supplier_name = $7, supplier_phone = $8, supplier_address = $9,
         authorized_by = $10, expense_date = $11,
         invoice_number = $12, has_invoice = $13, no_invoice_reason = $14,
         notes = $15
       WHERE id = $1 RETURNING ${EXP_COLUMNS}`,
      [
        id,
        body.category?.trim() || o.category,
        body.year ?? o.year,
        body.month ?? o.month,
        body.amount === undefined ? o.amount : Number(body.amount),
        body.vendorName === undefined
          ? o.vendorName ?? null
          : body.vendorName?.trim() || null,
        body.supplierName === undefined
          ? o.supplierName ?? null
          : body.supplierName?.trim() || null,
        body.supplierPhone === undefined
          ? o.supplierPhone ?? null
          : body.supplierPhone?.trim() || null,
        body.supplierAddress === undefined
          ? o.supplierAddress ?? null
          : body.supplierAddress?.trim() || null,
        body.authorizedBy === undefined
          ? o.authorizedBy ?? null
          : body.authorizedBy?.trim() || null,
        body.expenseDate === undefined
          ? o.expenseDate ?? null
          : body.expenseDate || null,
        hasInvoice
          ? body.invoiceNumber === undefined
            ? o.invoiceNumber ?? null
            : body.invoiceNumber?.trim() || null
          : null,
        hasInvoice,
        !hasInvoice
          ? body.noInvoiceReason === undefined
            ? o.noInvoiceReason ?? null
            : body.noInvoiceReason?.trim() || null
          : null,
        body.notes === undefined ? o.notes ?? null : body.notes?.trim() || null,
      ]
    );
    return NextResponse.json({ expense: toExpense(rows[0]) });
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  return withDb(async (c) => {
    const { rowCount } = await c.query("DELETE FROM expenses WHERE id = $1", [id]);
    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
