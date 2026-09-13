import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "claros_session";
const SECRET_KEY = process.env.AUTH_SECRET || process.env.TURSO_AUTH_TOKEN?.slice(0, 32) || "claros-default-secret-key-32-chars-long";
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export async function createSessionToken(uid: string): Promise<string> {
  return new SignJWT({ uid, authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(encodedKey);
}

export async function verifySessionToken(token: string): Promise<{ uid?: string, authenticated: boolean }> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return { uid: payload.uid as string, authenticated: payload.authenticated === true };
  } catch {
    return { authenticated: false };
  }
}

export async function setSessionCookie(uid: string): Promise<void> {
  const token = await createSessionToken(uid);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;

  const result = await verifySessionToken(token);
  return result.authenticated;
}

export async function getUserId(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const result = await verifySessionToken(token);
  return result.uid || null;
}
