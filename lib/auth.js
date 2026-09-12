import crypto from "crypto";
import Papa from "papaparse";

export const SESSION_COOKIE = "dandan_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90일 (로그인 유지)
export const PENDING_COOKIE = "dandan_social_pending";
export const PENDING_MAX_AGE = 60 * 10; // 10분 — 소셜 로그인 후 연락처 입력 대기

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

export function createSessionToken(payload, maxAgeSeconds = SESSION_MAX_AGE) {
  const secret = process.env.SESSION_SECRET;
  const body = base64url(JSON.stringify({ ...payload, exp: Date.now() + maxAgeSeconds * 1000 }));
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

// 카카오/네이버 소셜 로그인은 비밀번호가 없으니 passwordHash를 빈 값으로 회원 시트에 등록한다.
// 이미 그 전화번호로 가입된 회원이면(비밀번호 가입이든 소셜이든) 중복으로 또 추가하지 않는다.
// 실패해도 로그인 자체는 막지 않아야 하므로 호출부에서 항상 catch해서 쓴다.
export async function registerSocialMemberIfNew(phone) {
  const url = process.env.MEMBER_SIGNUP_WEBHOOK_URL;
  if (!url) return;
  const members = await getMembers();
  if (members.some((m) => m.phone === phone)) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, passwordHash: "" }),
    redirect: "follow",
  });
}
