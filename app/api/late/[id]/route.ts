import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toLate } from "@/lib/api-helpers";
import type { LateRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LATE_COLUMNS = `id, emp_id, date, late_minutes, notes, created_at`;

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  let body: Partial<LateRecord>;
  try {
    body = (await req.json()) as Partial<LateRecord>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  return withDb(async (c) => {
    const { rows: old } = await c.query(
      `SELECT ${LATE_COLUMNS} FROM late_records WHERE id = $1`,
      [id]
    );
    if (old.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const o = toLate(old[0]);
    const { rows } = await c.query(
      `UPDATE late_records SET date = $2, late_minutes = $3, notes = $4
       WHERE id = $1 RETURNING ${LATE_COLUMNS}`,
      [
        id,
        body.date ?? o.date,
        body.lateMinutes === undefined ? o.lateMinutes : Number(body.lateMinutes),
        body.notes === undefined ? o.notes : body.notes,
      ]
    );
    return NextResponse.json({ lateRecord: toLate(rows[0]) });
  });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  return withDb(async (c) => {
    const { rowCount } = await c.query(
      "DELETE FROM late_records WHERE id = $1",
      [id]
    );
    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
