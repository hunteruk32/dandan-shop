import { cookies } from "next/headers";
import { createSessionToken } from "@/lib/auth";

const REDIRECT_URI = "https://dandan-shop.co.kr/api/auth/kakao/callback";
export const PENDING_COOKIE = "dandan_kakao_pending";
export const PENDING_MAX_AGE = 60 * 10; // 10분

export async function GET(req) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = decodeURIComponent(searchParams.get("state") || "/");

  if (!code) {
    return Response.redirect(`${origin}/login?error=kakao_cancelled`, 302);
  }

  const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_API_KEY,
      client_secret: process.env.KAKAO_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    return Response.redirect(`${origin}/login?error=kakao_token`, 302);
  }

  const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = await profileRes.json();
  if (!profileRes.ok || !profile.id) {
    return Response.redirect(`${origin}/login?error=kakao_profile`, 302);
  }

  const nickname = profile.kakao_account?.profile?.nickname || "";
  const pendingToken = createSessionToken(
    { kakaoId: String(profile.id), nickname, provider: "kakao", next },
    PENDING_MAX_AGE
  );
  cookies().set(PENDING_COOKIE, pendingToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: PENDING_MAX_AGE,
    path: "/",
  });

  return Response.redirect(`${origin}/auth/complete-phone`, 302);
}
