import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toActivity } from "@/lib/api-helpers";
import type { EmployeeActivity } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACT_COLUMNS = `
  id, emp_id, type, date, title, description,
  old_value, new_value, amount, severity, created_at
`;

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  let body: Partial<EmployeeActivity>;
  try {
    body = (await req.json()) as Partial<EmployeeActivity>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  return withDb(async (c) => {
    const { rows: old } = await c.query(
      `SELECT ${ACT_COLUMNS} FROM employee_activities WHERE id = $1`,
      [id]
    );
    if (old.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const o = toActivity(old[0]);
    const { rows } = await c.query(
      `UPDATE employee_activities SET
        type = $2, date = $3, title = $4, description = $5,
        amount = $6, severity = $7
       WHERE id = $1 RETURNING ${ACT_COLUMNS}`,
      [
        id,
        body.type ?? o.type,
        body.date ?? o.date,
        body.title ?? o.title,
        body.description === undefined ? o.description : body.description,
        body.amount === undefined
          ? o.amount ?? null
          : body.amount == null
          ? null
          : Number(body.amount),
        body.severity === undefined ? o.severity ?? null : body.severity,
      ]
    );
    return NextResponse.json({ activity: toActivity(rows[0]) });
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  return withDb(async (c) => {
    const { rowCount } = await c.query(
      "DELETE FROM employee_activities WHERE id = $1",
      [id]
    );
    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
