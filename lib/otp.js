import crypto from "crypto";
import { sql } from "./db";

const OTP_TTL_MS = 5 * 60 * 1000; // 5분
const MAX_ATTEMPTS = 5;

export function generateOtpCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, "0");
}

// 같은 번호·목적으로 다시 요청하면 이전 코드는 자동으로 무효화된다(최신 1건만 조회해서 씀).
export async function issueOtp(phone, purpose) {
  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await sql`
    INSERT INTO otp_codes (phone, purpose, code, expires_at)
    VALUES (${phone}, ${purpose}, ${code}, ${expiresAt})
  `;
  return code;
}

export async function verifyOtp(phone, purpose, code) {
  const [row] = await sql`
    SELECT id, code, expires_at, used, attempts
    FROM otp_codes
    WHERE phone = ${phone} AND purpose = ${purpose}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!row) return { ok: false, error: "인증번호를 먼저 요청해주세요." };
  if (row.used) return { ok: false, error: "이미 사용된 인증번호예요. 다시 요청해주세요." };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, error: "인증번호가 만료됐어요. 다시 요청해주세요." };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "시도 횟수를 초과했어요. 인증번호를 다시 요청해주세요." };
  }

  if (row.code !== String(code || "").trim()) {
    await sql`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ${row.id}`;
    return { ok: false, error: "인증번호가 올바르지 않아요." };
  }

  await sql`UPDATE otp_codes SET used = true WHERE id = ${row.id}`;
  return { ok: true };
}
