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

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  return withDb(async (c) => {
    const { rows } = await c.query(
      `SELECT ${ACT_COLUMNS} FROM employee_activities
       ORDER BY date DESC, created_at DESC`
    );
    return NextResponse.json({ activities: rows.map(toActivity) });
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  let body: Partial<EmployeeActivity>;
  try {
    body = (await req.json()) as Partial<EmployeeActivity>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const title = body.title?.trim();
  if (!body.empId || !body.type || !body.date || !title) {
    return NextResponse.json(
      { error: "empId, type, date, title required." },
      { status: 400 }
    );
  }

  return withDb(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO employee_activities
       (emp_id, type, date, title, description, old_value, new_value, amount, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${ACT_COLUMNS}`,
      [
        body.empId,
        body.type,
        body.date,
        title,
        body.description ?? null,
        body.oldValue == null ? null : String(body.oldValue),
        body.newValue == null ? null : String(body.newValue),
        body.amount == null ? null : Number(body.amount),
        body.severity ?? null,
      ]
    );
    return NextResponse.json({ activity: toActivity(rows[0]) }, { status: 201 });
  });
}
