// HS256 JWT helpers using Web Crypto only — works in both
// Node.js (API routes) and Edge (middleware) runtimes, no jose
// dependency. Bcrypt lives in the login route which is Node-only.

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
}

const SECRET_STRING =
  process.env.JWT_SECRET ||
  "dev-only-fallback-secret-replace-via-env-in-production";

const SECRET_BYTES = new TextEncoder().encode(SECRET_STRING);

const COOKIE_NAME = "amd_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_TTL_SECONDS = SESSION_TTL;

function base64UrlEncode(input: string | ArrayBuffer): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Decode base64url into a fresh standalone ArrayBuffer (not a
// Uint8Array view) so crypto.subtle reliably accepts it across
// Node and the Edge middleware sandbox.
function base64UrlDecodeBuf(input: string): ArrayBuffer {
  let str = input.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const ab = new ArrayBuffer(binary.length);
  const u8 = new Uint8Array(ab);
  for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
  return ab;
}

// Encode a string into a fresh standalone ArrayBuffer.
function encodeStr(s: string): ArrayBuffer {
  const bytes = new TextEncoder().encode(s);
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
}

let cachedKey: CryptoKey | null = null;
async function getKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  cachedKey = await crypto.subtle.importKey(
    "raw",
    SECRET_BYTES,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  return cachedKey;
}

interface FullJwtPayload extends SessionPayload {
  iat: number;
  exp: number;
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const full: FullJwtPayload = {
    ...payload,
    iat: now,
    exp: now + SESSION_TTL,
  };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(full));
  const data = `${headerB64}.${payloadB64}`;

  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encodeStr(data));
  const sigB64 = base64UrlEncode(sig);
  return `${data}.${sigB64}`;
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  if (!token || token.split(".").length !== 3) return null;
  const [headerB64, payloadB64, sigB64] = token.split(".");
  const data = `${headerB64}.${payloadB64}`;

  const key = await getKey();
  // Edge dev sandbox is picky: build inputs inline using TypedArrays
  // (Uint8Array) which crypto.subtle accepts as BufferSource.
  let str = sigB64.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const sig = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) sig[i] = binary.charCodeAt(i);

  const dataBytes = new TextEncoder().encode(data);

  const valid = await crypto.subtle.verify("HMAC", key, sig, dataBytes);
  if (!valid) return null;

  let parsed: unknown;
  try {
    const json = new TextDecoder().decode(base64UrlDecodeBuf(payloadB64));
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const p = parsed as Record<string, unknown>;

  const now = Math.floor(Date.now() / 1000);
  if (typeof p.exp === "number" && p.exp < now) return null;
  if (
    typeof p.userId !== "string" ||
    typeof p.username !== "string" ||
    typeof p.name !== "string"
  ) {
    return null;
  }
  return {
    userId: p.userId,
    username: p.username,
    name: p.name,
    role: typeof p.role === "string" ? p.role : "admin",
  };
}
