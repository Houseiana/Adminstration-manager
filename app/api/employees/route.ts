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

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  return withDb(async (c) => {
    const { rows } = await c.query(
      `SELECT ${EMP_COLUMNS} FROM employees ORDER BY id`
    );
    return NextResponse.json({ employees: rows.map(toEmployee) });
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireSession();
  if (auth.error) return auth.error;

  let body: Partial<Employee>;
  try {
    body = (await req.json()) as Partial<Employee>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.name_en?.trim() || !body.title_en?.trim() || !body.email?.trim()) {
    return NextResponse.json(
      { error: "name_en, title_en, and email are required." },
      { status: 400 }
    );
  }

  return withDb(async (c) => {
    // Generate next ID like EMP-1001 — find current max and add 1.
    const { rows: maxRows } = await c.query(
      `SELECT id FROM employees WHERE id LIKE 'EMP-%' ORDER BY
       CAST(SUBSTRING(id FROM 5) AS INT) DESC LIMIT 1`
    );
    const max = maxRows[0]
      ? parseInt(String(maxRows[0].id).replace("EMP-", ""), 10) || 1000
      : 1000;
    const id = `EMP-${max + 1}`;

    const childrenCount =
      body.maritalStatus === "single" ? 0 : Number(body.childrenCount) || 0;

    const { rows } = await c.query(
      `INSERT INTO employees (
        id, name_en, name_ar, title_en, title_ar, photo_url,
        department, phone, email, address, national_id, dob,
        marital_status, children_count, education, previous_experience,
        work_phone, emergency_phone, type, contract_type,
        hiring_date, termination_date, location, manager,
        salary, allowances, commission, raise_amount, raise_date,
        payment_method, bank_account, status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16,
        $17, $18, $19, $20,
        $21, $22, $23, $24,
        $25, $26, $27, $28, $29,
        $30, $31, $32
      ) RETURNING ${EMP_COLUMNS}`,
      [
        id,
        body.name_en,
        body.name_ar || body.name_en,
        body.title_en,
        body.title_ar || body.title_en,
        body.photoUrl ?? null,
        body.department ?? "Sales",
        body.phone ?? "",
        body.email,
        body.address ?? "",
        body.nationalId ?? "",
        body.dob || null,
        body.maritalStatus ?? null,
        childrenCount,
        body.education ?? null,
        body.previousExperience ?? null,
        body.workPhone ?? null,
        body.emergencyPhone ?? null,
        body.type ?? "full",
        body.contractType ?? null,
        body.hiringDate || new Date().toISOString().slice(0, 10),
        body.terminationDate || null,
        body.location ?? "",
        body.manager ?? "",
        Number(body.salary) || 0,
        Number(body.allowances) || 0,
        Number(body.commission) || 0,
        Number(body.raise) || 0,
        body.raiseDate || null,
        body.paymentMethod ?? "bank",
        body.bankAccount ?? "",
        body.status ?? "active",
      ]
    );

    const created = toEmployee(rows[0]);

    // Auto-log "hired" activity
    await c.query(
      `INSERT INTO employee_activities (emp_id, type, date, title, description)
       VALUES ($1, 'hired', $2, $3, $4)`,
      [
        id,
        created.hiringDate,
        "Employee hired",
        `Joined as ${created.title_en} in ${created.department}`,
      ]
    );

    return NextResponse.json({ employee: created }, { status: 201 });
  });
}
