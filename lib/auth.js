import crypto from "crypto";
import Papa from "papaparse";

export const SESSION_COOKIE = "dandan_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90일 (로그인 유지)

export function normalizePhone(phone) {
  return String(phone || "").replace(/[^0-9]/g, "");
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const check = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(check, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function createSessionToken(payload) {
  const secret = process.env.SESSION_SECRET;
  const body = base64url(JSON.stringify({ ...payload, exp: Date.now() + SESSION_MAX_AGE * 1000 }));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token) {
  const secret = process.env.SESSION_SECRET;
  if (!token || !secret) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getMembers() {
  const res = await fetch(process.env.MEMBERS_CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Members CSV fetch failed: ${res.status}`);
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data
    .filter((r) => r["전화번호"])
    .map((r) => ({
      phone: normalizePhone(r["전화번호"]),
      passwordHash: String(r["비밀번호해시"] || "").trim(),
      createdAt: String(r["가입일시"] || "").trim(),
    }));
}
