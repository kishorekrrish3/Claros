"use server";

import { redirect } from "next/navigation";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function loginAction(password: string): Promise<AuthResult> {
  const expectedPassword = process.env.APP_PASSWORD;

  if (!expectedPassword) {
    // If no password set in .env, accept any password or allow access
    await setSessionCookie();
    return { success: true };
  }

  if (password !== expectedPassword) {
    return { success: false, error: "Incorrect password. Please try again." };
  }

  await setSessionCookie();
  return { success: true };
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
