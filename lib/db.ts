import { Client, types } from "pg";

// Return DATE columns as plain YYYY-MM-DD strings (pg's default
// would give us a JS Date at UTC midnight which then leaks the
// local timezone offset on serialization).
types.setTypeParser(1082, (v: string | null) => (v ? v : null));

export async function withDb<T>(
  fn: (client: Client) => Promise<T>
): Promise<T> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => {});
  }
}
