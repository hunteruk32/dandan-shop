import { cookies } from "next/headers";
import {
  getMembers,
  hashPassword,
  createSessionToken,
  normalizePhone,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export async function POST(req) {
  const body = await req.json();
  const phone = normalizePhone(body.phone);
  const password = String(body.password || "");

  if (phone.length < 9) {
    return Response.json({ ok: false, error: "전화번호를 정확히 입력해주세요." }, { status: 400 });
  }
  if (password.length < 4) {
    return Response.json({ ok: false, error: "비밀번호는 4자 이상이어야 해요." }, { status: 400 });
  }

  const url = process.env.MEMBER_SIGNUP_WEBHOOK_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "회원가입 연결이 아직 설정되지 않았어요 (MEMBER_SIGNUP_WEBHOOK_URL 없음)." },
      { status: 500 }
    );
  }

  const members = await getMembers();
  if (members.some((m) => m.phone === phone)) {
    return Response.json({ ok: false, error: "이미 가입된 전화번호예요." }, { status: 409 });
  }

  const passwordHash = hashPassword(password);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, passwordHash }),
    redirect: "follow",
  });

  if (!res.ok) {
    return Response.json({ ok: false, error: "회원가입에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }

  const token = createSessionToken({ phone });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return Response.json({ ok: true, phone });
}
