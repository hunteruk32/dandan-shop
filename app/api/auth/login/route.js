import { cookies } from "next/headers";
import {
  getMembers,
  verifyPassword,
  createSessionToken,
  normalizePhone,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/auth";

export async function POST(req) {
  const body = await req.json();
  const phone = normalizePhone(body.phone);
  const password = String(body.password || "");

  const members = await getMembers();
  const member = members.find((m) => m.phone === phone);

  if (!member || !verifyPassword(password, member.passwordHash)) {
    return Response.json({ ok: false, error: "전화번호 또는 비밀번호가 올바르지 않아요." }, { status: 401 });
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
