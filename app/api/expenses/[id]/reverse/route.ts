import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toExpense } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXP_COLUMNS = `
  id, category, year, month, amount,
  vendor_name, supplier_name, supplier_phone, supplier_address,
  authorized_by, expense_date,
  invoice_number, has_invoice, no_invoice_reason,
  notes, voided_at, reverses_id, reversal_reason,
  created_at, updated_at
`;

interface Ctx {
  params: Promise<{ id: string }>;
}

interface ReverseBody {
  reason?: string;
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  let body: ReverseBody = {};
  try {
    body = (await req.json()) as ReverseBody;
  } catch {
    body = {};
  }
  const reason = body.reason?.trim();

  return withDb(async (c) => {
    await c.query("BEGIN");
    try {
      const { rows: oRows } = await c.query(
        `SELECT ${EXP_COLUMNS} FROM expenses WHERE id = $1 FOR UPDATE`,
        [id]
      );
      if (oRows.length === 0) {
        await c.query("ROLLBACK");
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      const original = toExpense(oRows[0]);

      if (original.voidedAt) {
        await c.query("ROLLBACK");
        return NextResponse.json(
          { error: "Entry is already reversed." },
          { status: 400 }
        );
      }
      if (original.reversesId) {
        await c.query("ROLLBACK");
        return NextResponse.json(
          { error: "A reversal entry cannot itself be reversed." },
          { status: 400 }
        );
      }

      const today = new Date().toISOString().slice(0, 10);
      const reasonText =
        reason ||
        `إلغاء القيد رقم ${
          original.invoiceNumber ?? original.id.slice(0, 8)
        }`;

      // Reversal entry — same category / amount / month so the
      // matrix totals still net to zero, but flagged as a reversal.
      const { rows: revRows } = await c.query(
        `INSERT INTO expenses (
          category, year, month, amount,
          vendor_name, supplier_name, supplier_phone, supplier_address,
          authorized_by, expense_date,
          invoice_number, has_invoice, no_invoice_reason,
          notes, reverses_id, reversal_reason
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10,
          NULL, FALSE, $11,
          NULL, $12, $13
        ) RETURNING ${EXP_COLUMNS}`,
        [
          original.category,
          original.year,
          original.month,
          original.amount,
          original.vendorName ?? null,
          original.supplierName ?? null,
          original.supplierPhone ?? null,
          original.supplierAddress ?? null,
          auth.session.name,
          today,
          reasonText,
          original.id,
          reason ?? null,
        ]
      );
      const reversal = toExpense(revRows[0]);

      // Void the original.
      const { rows: voidRows } = await c.query(
        `UPDATE expenses SET voided_at = NOW() WHERE id = $1
         RETURNING ${EXP_COLUMNS}`,
        [id]
      );
      const voided = toExpense(voidRows[0]);

      await c.query("COMMIT");
      return NextResponse.json({ reversal, voided }, { status: 201 });
    } catch (err) {
      await c.query("ROLLBACK");
      console.error("Reverse failed", err);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  });
}
