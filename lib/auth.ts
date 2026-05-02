import { SignJWT, jwtVerify } from "jose";

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: string;
}

const SECRET_STRING =
  process.env.JWT_SECRET ||
  "dev-only-fallback-secret-replace-via-env-in-production";
const SECRET = new TextEncoder().encode(SECRET_STRING);

const COOKIE_NAME = "amd_session";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days

export const SESSION_COOKIE_NAME = COOKIE_NAME;
export const SESSION_TTL_SECONDS = SESSION_TTL;

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL}s`)
    .sign(SECRET);
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      username: payload.username,
      name: payload.name,
      role: typeof payload.role === "string" ? payload.role : "admin",
    };
  } catch {
    return null;
  }
}
