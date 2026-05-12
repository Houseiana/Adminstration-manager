import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toExpense } from "@/lib/api-helpers";
import type { ExpenseEntry } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXP_COLUMNS = `id, category, year, month, amount, notes, created_at, updated_at`;

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
    const { rows } = await c.query(
      `UPDATE expenses SET
        category = $2, year = $3, month = $4, amount = $5, notes = $6
       WHERE id = $1 RETURNING ${EXP_COLUMNS}`,
      [
        id,
        body.category?.trim() || o.category,
        body.year ?? o.year,
        body.month ?? o.month,
        body.amount === undefined ? o.amount : Number(body.amount),
        body.notes === undefined ? o.notes : body.notes,
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
