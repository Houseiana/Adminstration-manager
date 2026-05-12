import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toLate } from "@/lib/api-helpers";
import type { LateRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LATE_COLUMNS = `id, emp_id, date, late_minutes, notes, created_at`;

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  return withDb(async (c) => {
    const { rows } = await c.query(
      `SELECT ${LATE_COLUMNS} FROM late_records ORDER BY date DESC, created_at DESC`
    );
    return NextResponse.json({ lateRecords: rows.map(toLate) });
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  let body: Partial<LateRecord>;
  try {
    body = (await req.json()) as Partial<LateRecord>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.empId || !body.date || !body.lateMinutes) {
    return NextResponse.json(
      { error: "empId, date, lateMinutes required." },
      { status: 400 }
    );
  }
  const minutes = Number(body.lateMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 480) {
    return NextResponse.json(
      { error: "lateMinutes must be 1..480." },
      { status: 400 }
    );
  }

  return withDb(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO late_records (emp_id, date, late_minutes, notes)
       VALUES ($1, $2, $3, $4) RETURNING ${LATE_COLUMNS}`,
      [body.empId, body.date, minutes, body.notes ?? null]
    );
    return NextResponse.json({ lateRecord: toLate(rows[0]) }, { status: 201 });
  });
}
