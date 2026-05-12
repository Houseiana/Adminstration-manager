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

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  return withDb(async (c) => {
    const { rows } = await c.query(
      `SELECT ${EXP_COLUMNS} FROM expenses WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ expense: toExpense(rows[0]) });
  });
}

// Accounting rule: a posted entry cannot be edited or deleted.
// To correct a mistake, POST /api/expenses/:id/reverse — that
// inserts a new entry tied back to this one and marks this one
// as voided. Both stay in the audit log.
const METHOD_BLOCKED = NextResponse.json(
  {
    error:
      "Posted entries cannot be edited or deleted. Use the reverse endpoint to issue a correcting entry.",
  },
  { status: 405 }
);
const blocked = async () => METHOD_BLOCKED;
export const PUT = blocked;
export const PATCH = blocked;
export const DELETE = blocked;
