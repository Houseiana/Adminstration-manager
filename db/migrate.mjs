// Run with: node db/migrate.mjs [schema|seed|all]
// Reads DATABASE_URL from env or ~/.amd-db-url file.

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const fallback = join(homedir(), ".amd-db-url");
  if (existsSync(fallback)) return readFileSync(fallback, "utf8").trim();
  throw new Error("Set DATABASE_URL env var or write the URL to ~/.amd-db-url");
}

const action = process.argv[2] || "schema";

const files =
  action === "schema" ? ["schema.sql"] :
  action === "seed"   ? ["seed.sql"]   :
  action === "all"    ? ["schema.sql", "seed.sql"] :
  null;

if (!files) {
  console.error("Usage: node db/migrate.mjs [schema|seed|all]");
  process.exit(1);
}

const client = new pg.Client({
  connectionString: getUrl(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log("Connected to Neon.");

for (const f of files) {
  const path = join(__dirname, f);
  const sql = readFileSync(path, "utf8");
  console.log(`\n→ Running ${f} (${sql.length} bytes)`);
  await client.query(sql);
  console.log(`✓ ${f} OK`);
}

const counts = await client.query(`
  SELECT 'employees'           AS t, COUNT(*)::int AS n FROM employees
  UNION ALL SELECT 'leaves',                COUNT(*)::int FROM leaves
  UNION ALL SELECT 'late_records',          COUNT(*)::int FROM late_records
  UNION ALL SELECT 'employee_activities',   COUNT(*)::int FROM employee_activities
  UNION ALL SELECT 'payroll_adjustments',   COUNT(*)::int FROM payroll_adjustments
  ORDER BY t;
`);

console.log("\nRow counts:");
for (const r of counts.rows) console.log(`  ${r.t.padEnd(22)} ${r.n}`);

await client.end();
console.log("\nDone.");
