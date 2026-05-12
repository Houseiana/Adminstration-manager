import { NextRequest, NextResponse } from "next/server";
import { withDb } from "@/lib/db";
import { requireSession, toEmployee } from "@/lib/api-helpers";
import type { Employee } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMP_COLUMNS = `
  id, name_en, name_ar, title_en, title_ar, photo_url,
  department, phone, email, address, national_id, dob,
  marital_status, children_count, education, previous_experience,
  work_phone, emergency_phone, type, contract_type,
  hiring_date, termination_date, location, manager,
  salary, allowances, commission, raise_amount, raise_date,
  payment_method, bank_account, status, created_at, updated_at
`;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  return withDb(async (c) => {
    const { rows } = await c.query(
      `SELECT ${EMP_COLUMNS} FROM employees WHERE id = $1`,
      [id]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ employee: toEmployee(rows[0]) });
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  let body: Partial<Employee>;
  try {
    body = (await req.json()) as Partial<Employee>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  return withDb(async (c) => {
    // Load existing for change diffing
    const { rows: oldRows } = await c.query(
      `SELECT ${EMP_COLUMNS} FROM employees WHERE id = $1`,
      [id]
    );
    if (oldRows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const old = toEmployee(oldRows[0]);
    const childrenCount =
      body.maritalStatus === "single" ? 0 : Number(body.childrenCount) || 0;

    const { rows } = await c.query(
      `UPDATE employees SET
        name_en = $2, name_ar = $3, title_en = $4, title_ar = $5,
        photo_url = $6, department = $7, phone = $8, email = $9,
        address = $10, national_id = $11, dob = $12,
        marital_status = $13, children_count = $14, education = $15,
        previous_experience = $16, work_phone = $17, emergency_phone = $18,
        type = $19, contract_type = $20, hiring_date = $21,
        termination_date = $22, location = $23, manager = $24,
        salary = $25, allowances = $26, commission = $27,
        raise_amount = $28, raise_date = $29,
        payment_method = $30, bank_account = $31, status = $32
      WHERE id = $1
      RETURNING ${EMP_COLUMNS}`,
      [
        id,
        body.name_en ?? old.name_en,
        body.name_ar ?? old.name_ar,
        body.title_en ?? old.title_en,
        body.title_ar ?? old.title_ar,
        body.photoUrl === undefined ? old.photoUrl : body.photoUrl,
        body.department ?? old.department,
        body.phone ?? old.phone,
        body.email ?? old.email,
        body.address ?? old.address,
        body.nationalId ?? old.nationalId,
        body.dob ?? old.dob ?? null,
        body.maritalStatus === undefined ? old.maritalStatus : body.maritalStatus,
        childrenCount,
        body.education === undefined ? old.education : body.education,
        body.previousExperience === undefined
          ? old.previousExperience
          : body.previousExperience,
        body.workPhone === undefined ? old.workPhone : body.workPhone,
        body.emergencyPhone === undefined
          ? old.emergencyPhone
          : body.emergencyPhone,
        body.type ?? old.type,
        body.contractType === undefined ? old.contractType : body.contractType,
        body.hiringDate ?? old.hiringDate,
        body.terminationDate ?? old.terminationDate ?? null,
        body.location ?? old.location,
        body.manager ?? old.manager,
        body.salary === undefined ? old.salary : Number(body.salary),
        body.allowances === undefined ? old.allowances : Number(body.allowances),
        body.commission === undefined ? old.commission : Number(body.commission),
        body.raise === undefined ? old.raise : Number(body.raise),
        body.raiseDate === undefined ? old.raiseDate : body.raiseDate,
        body.paymentMethod ?? old.paymentMethod,
        body.bankAccount ?? old.bankAccount,
        body.status ?? old.status,
      ]
    );

    const updated = toEmployee(rows[0]);
    const today = new Date().toISOString().slice(0, 10);

    // Auto-log meaningful changes
    const acts: Array<{
      type: string;
      title: string;
      old?: string | number;
      new?: string | number;
      amount?: number;
    }> = [];
    if (old.salary !== updated.salary) {
      acts.push({
        type: "salary_changed",
        title: updated.salary > old.salary ? "Salary increase" : "Salary adjustment",
        old: old.salary,
        new: updated.salary,
        amount: updated.salary - old.salary,
      });
    }
    if (old.title_en !== updated.title_en) {
      acts.push({
        type: "promoted",
        title: "Title change",
        old: old.title_en,
        new: updated.title_en,
      });
    }
    if (old.department !== updated.department) {
      acts.push({
        type: "transferred",
        title: "Department transfer",
        old: old.department,
        new: updated.department,
      });
    }
    if (old.status !== updated.status) {
      acts.push({
        type: "status_changed",
        title: "Status change",
        old: old.status,
        new: updated.status,
      });
    }
    if (old.type !== updated.type) {
      acts.push({
        type: "type_changed",
        title: "Employment type change",
        old: old.type,
        new: updated.type,
      });
    }
    if (old.contractType !== updated.contractType) {
      acts.push({
        type: "contract_changed",
        title: "Contract type change",
        old: old.contractType ?? "—",
        new: updated.contractType ?? "—",
      });
    }

    for (const a of acts) {
      await c.query(
        `INSERT INTO employee_activities
         (emp_id, type, date, title, old_value, new_value, amount)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, a.type, today, a.title, String(a.old ?? ""), String(a.new ?? ""), a.amount ?? null]
      );
    }

    return NextResponse.json({ employee: updated });
  });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;

  return withDb(async (c) => {
    const { rowCount } = await c.query("DELETE FROM employees WHERE id = $1", [
      id,
    ]);
    if (!rowCount) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  });
}
