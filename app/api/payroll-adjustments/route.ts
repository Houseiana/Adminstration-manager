import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toAdjustment } from "@/lib/api-helpers";
import type { PayrollAdjustment, PayrollStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADJ_COLUMNS = `
  emp_id, year, month, unpaid, deductions, bonuses,
  status, notes, created_at, updated_at
`;

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  return withDb(async (c) => {
    const { rows } = await c.query(`SELECT ${ADJ_COLUMNS} FROM payroll_adjustments`);
    return NextResponse.json({ adjustments: rows.map(toAdjustment) });
  });
}

interface UpsertBody {
  empId?: string;
  year?: number;
  month?: number;
  unpaid?: number;
  deductions?: number;
  bonuses?: number;
  status?: PayrollStatus;
  notes?: string;
}

export async function PUT(req: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  let body: UpsertBody;
  try {
    body = (await req.json()) as UpsertBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (
    !body.empId ||
    typeof body.year !== "number" ||
    typeof body.month !== "number"
  ) {
    return NextResponse.json(
      { error: "empId, year, month required." },
      { status: 400 }
    );
  }

  return withDb(async (c) => {
    const { rows } = await c.query(
      `INSERT INTO payroll_adjustments
         (emp_id, year, month, unpaid, deductions, bonuses, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (emp_id, year, month) DO UPDATE SET
         unpaid     = COALESCE(EXCLUDED.unpaid,     payroll_adjustments.unpaid),
         deductions = COALESCE(EXCLUDED.deductions, payroll_adjustments.deductions),
         bonuses    = COALESCE(EXCLUDED.bonuses,    payroll_adjustments.bonuses),
         status     = COALESCE(EXCLUDED.status,     payroll_adjustments.status),
         notes      = COALESCE(EXCLUDED.notes,      payroll_adjustments.notes),
         updated_at = NOW()
       RETURNING ${ADJ_COLUMNS}`,
      [
        body.empId,
        body.year,
        body.month,
        body.unpaid ?? 0,
        body.deductions ?? 0,
        body.bonuses ?? 0,
        body.status ?? "draft",
        body.notes ?? null,
      ]
    );
    return NextResponse.json({ adjustment: toAdjustment(rows[0]) });
  });
}
