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

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  return withDb(async (c) => {
    const { rows } = await c.query(
      `SELECT ${EXP_COLUMNS} FROM expenses
       ORDER BY year DESC, month DESC, COALESCE(expense_date, make_date(year, month + 1, 1)) DESC, created_at DESC`
    );
    return NextResponse.json({ expenses: rows.map(toExpense) });
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  let body: Partial<ExpenseEntry>;
  try {
    body = (await req.json()) as Partial<ExpenseEntry>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const category = body.category?.trim();
  if (!category || typeof body.year !== "number" || typeof body.month !== "number") {
    return NextResponse.json(
      { error: "category, year, month required." },
      { status: 400 }
    );
  }
  if (body.month < 0 || body.month > 11) {
    return NextResponse.json({ error: "month must be 0..11" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return NextResponse.json({ error: "amount must be >= 0" }, { status: 400 });
  }

  const hasInvoice = body.hasInvoice !== false;
  return withDb(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO expenses (
         category, year, month, amount,
         vendor_name, supplier_name, supplier_phone, supplier_address,
         authorized_by, expense_date,
         invoice_number, has_invoice, no_invoice_reason,
         notes
       ) VALUES (
         $1, $2, $3, $4,
         $5, $6, $7, $8,
         $9, $10,
         $11, $12, $13,
         $14
       ) RETURNING ${EXP_COLUMNS}`,
      [
        category,
        body.year,
        body.month,
        amount,
        body.vendorName?.trim() || null,
        body.supplierName?.trim() || null,
        body.supplierPhone?.trim() || null,
        body.supplierAddress?.trim() || null,
        body.authorizedBy?.trim() || null,
        body.expenseDate || null,
        hasInvoice ? body.invoiceNumber?.trim() || null : null,
        hasInvoice,
        !hasInvoice ? body.noInvoiceReason?.trim() || null : null,
        body.notes?.trim() || null,
      ]
    );
    return NextResponse.json({ expense: toExpense(rows[0]) }, { status: 201 });
  });
}
