import { cookies } from "next/headers";
import {
  createSessionToken,
  normalizePhone,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  PENDING_COOKIE,
  PENDING_MAX_AGE,
} from "@/lib/auth";

const REDIRECT_URI = "https://dandan-shop.co.kr/api/auth/naver/callback";

export async function GET(req) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = decodeURIComponent(searchParams.get("state") || "/");

  if (!code) {
    return Response.redirect(`${origin}/login?error=naver_cancelled`, 302);
  }

  const tokenUrl =
    `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code` +
    `&client_id=${process.env.NAVER_CLIENT_ID}` +
    `&client_secret=${process.env.NAVER_CLIENT_SECRET}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&code=${code}&state=${encodeURIComponent(next)}`;
  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    return Response.redirect(`${origin}/login?error=naver_token`, 302);
  }

  const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profileData = await profileRes.json();
  const profile = profileData.response;
  if (!profileRes.ok || profileData.resultcode !== "00" || !profile?.id) {
    return Response.redirect(`${origin}/login?error=naver_profile`, 302);
  }

  const socialId = String(profile.id);
  const nickname = profile.name || profile.nickname || "";
  const phone = normalizePhone(profile.mobile || "");

  if (phone.length >= 9) {
    const token = createSessionToken({ phone, socialId, nickname, provider: "naver" });
    cookies().set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return Response.redirect(`${origin}${next}`, 302);
  }

  const pendingToken = createSessionToken(
    { socialId, nickname, provider: "naver", next },
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
