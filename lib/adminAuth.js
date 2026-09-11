import crypto from "crypto";
import { createSessionToken, verifySessionToken } from "./auth";

export const ADMIN_SESSION_COOKIE = "dandan_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12; // 12시간

export function checkAdminPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const a = Buffer.from(String(password || ""));
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createAdminSessionToken() {
  return createSessionToken({ role: "admin" }, ADMIN_SESSION_MAX_AGE);
}

export function isValidAdminSession(token) {
  const payload = verifySessionToken(token);
  return Boolean(payload && payload.role === "admin");
}

export { ADMIN_SESSION_MAX_AGE };
