import { cookies } from "next/headers";
import {
  verifySessionToken,
  createSessionToken,
  normalizePhone,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  PENDING_COOKIE,
} from "@/lib/auth";

export async function POST(req) {
  const pending = verifySessionToken(cookies().get(PENDING_COOKIE)?.value);
  if (!pending || !pending.socialId) {
    return Response.json(
      { ok: false, error: "인증 정보가 만료되었어요. 다시 로그인해주세요." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const phone = normalizePhone(body.phone);
  if (phone.length < 9) {
    return Response.json({ ok: false, error: "전화번호를 정확히 입력해주세요." }, { status: 400 });
  }

  const token = createSessionToken({
    phone,
    socialId: pending.socialId,
    nickname: pending.nickname,
    provider: pending.provider,
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  cookies().set(PENDING_COOKIE, "", { maxAge: 0, path: "/" });

  return Response.json({ ok: true, phone, next: pending.next || "/" });
}
