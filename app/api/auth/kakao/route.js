const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const REDIRECT_URI = "https://dandan-shop.co.kr/api/auth/kakao/callback";

export async function GET(req) {
  const next = new URL(req.url).searchParams.get("next") || "/";
  const url =
    `${KAKAO_AUTH_URL}?client_id=${process.env.KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code&state=${encodeURIComponent(next)}`;
  return Response.redirect(url, 302);
}
