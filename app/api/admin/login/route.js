import { cookies } from "next/headers";
import { checkAdminPassword, createAdminSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/adminAuth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!checkAdminPassword(body.password)) {
    return Response.json({ ok: false, error: "비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  cookies().set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
    maxAge: ADMIN_SESSION_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return Response.json({ ok: true });
}
