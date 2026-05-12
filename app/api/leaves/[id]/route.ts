import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toLeave } from "@/lib/api-helpers";
import type { LeaveRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LEAVE_COLUMNS = `
  id, emp_id, type, start_date, end_date, notes,
  medical_report, created_at, updated_at
`;

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  let body: Partial<LeaveRecord>;
  try {
    body = (await req.json()) as Partial<LeaveRecord>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  return withDb(async (c) => {
    const { rows: old } = await c.query(
      `SELECT ${LEAVE_COLUMNS} FROM leaves WHERE id = $1`,
      [id]
    );
    if (old.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const o = toLeave(old[0]);
    const { rows } = await c.query(
      `UPDATE leaves SET
        type = $2, start_date = $3, end_date = $4,
        notes = $5, medical_report = $6
       WHERE id = $1 RETURNING ${LEAVE_COLUMNS}`,
      [
        id,
        body.type ?? o.type,
        body.startDate ?? o.startDate,
        body.endDate ?? o.endDate,
        body.notes === undefined ? o.notes : body.notes,
        body.medicalReport === undefined
          ? o.medicalReport
          : Boolean(body.medicalReport),
      ]
    );
    return NextResponse.json({ leave: toLeave(rows[0]) });
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  return withDb(async (c) => {
    const { rowCount } = await c.query("DELETE FROM leaves WHERE id = $1", [id]);
    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
