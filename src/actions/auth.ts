"use server";

import { redirect } from "next/navigation";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase/admin";

export interface AuthResult {
  success: boolean;
  error?: string;
}

export async function loginAction(idToken: string): Promise<AuthResult> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    
    await setSessionCookie(uid);
    return { success: true };
  } catch (error) {
    console.error("Firebase ID Token verification failed:", error);
    return { success: false, error: "Authentication failed. Invalid token." };
  }
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}
