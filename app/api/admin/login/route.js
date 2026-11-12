import { cookies } from "next/headers";
import { checkAdminPassword, createAdminSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from "@/lib/adminAuth";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!checkAdminPassword(body.password)) {
    return Response.json({ ok: false, error: "비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  // 세션 토큰 생성이 실패하면(예: 서버 환경변수 문제) 빈 응답이 그대로 나가서
  // 클라이언트의 res.json()이 "Unexpected end of JSON input"으로 깨지는 대신,
  // 원인을 알 수 있는 JSON 에러를 돌려준다.
  try {
    cookies().set(ADMIN_SESSION_COOKIE, createAdminSessionToken(), {
      maxAge: ADMIN_SESSION_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } catch (err) {
    console.error("admin login session creation failed:", err);
    return Response.json({ ok: false, error: "로그인 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
