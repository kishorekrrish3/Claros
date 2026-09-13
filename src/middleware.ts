import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "claros_session";
const SECRET_KEY = process.env.AUTH_SECRET || process.env.TURSO_AUTH_TOKEN?.slice(0, 32) || "claros-default-secret-key-32-chars-long";
const encodedKey = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isPublicFile = pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".");

  if (isPublicFile) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isValid = false;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, encodedKey, {
        algorithms: ["HS256"],
      });
      isValid = payload.authenticated === true && !!payload.uid;
    } catch {
      isValid = false;
    }
  }

  // If on login page and already logged in, redirect to home
  if (isLoginPage && isValid) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // If not logged in and accessing a protected page, redirect to login
  if (!isLoginPage && !isValid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
