const NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize";
const REDIRECT_URI = "https://dandan-shop.co.kr/api/auth/naver/callback";

export async function GET(req) {
  const next = new URL(req.url).searchParams.get("next") || "/";
  const url =
    `${NAVER_AUTH_URL}?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${encodeURIComponent(next)}`;
  return Response.redirect(url, 302);
}
