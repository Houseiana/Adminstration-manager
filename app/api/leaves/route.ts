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

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  return withDb(async (c) => {
    const { rows } = await c.query(
      `SELECT ${LEAVE_COLUMNS} FROM leaves ORDER BY start_date DESC`
    );
    return NextResponse.json({ leaves: rows.map(toLeave) });
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  let body: Partial<LeaveRecord>;
  try {
    body = (await req.json()) as Partial<LeaveRecord>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.empId || !body.type || !body.startDate || !body.endDate) {
    return NextResponse.json(
      { error: "empId, type, startDate, endDate required." },
      { status: 400 }
    );
  }
  if (new Date(body.endDate) < new Date(body.startDate)) {
    return NextResponse.json(
      { error: "endDate is before startDate." },
      { status: 400 }
    );
  }

  return withDb(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO leaves (emp_id, type, start_date, end_date, notes, medical_report)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${LEAVE_COLUMNS}`,
      [
        body.empId,
        body.type,
        body.startDate,
        body.endDate,
        body.notes ?? null,
        body.type === "sick" ? Boolean(body.medicalReport) : false,
      ]
    );
    return NextResponse.json({ leave: toLeave(rows[0]) }, { status: 201 });
  });
}
