import crypto from "crypto";
import { cookies } from "next/headers";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "RECRUITER" | "APPLICANT";
}

const SECRET = process.env.AUTH_SECRET || "ai-resume-screener-super-secret-salt-2026";
const COOKIE_NAME = "resume_screener_session";

// Hash password with salt
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return key === hash;
}

// Sign and encode session token
export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payload)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    return decoded as SessionUser;
  } catch {
    return null;
  }
}

// Next.js Server Side Session helper
export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
