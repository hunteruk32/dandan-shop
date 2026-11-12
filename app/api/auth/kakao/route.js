const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const REDIRECT_URI = "https://dandan-shop.co.kr/api/auth/kakao/callback";

export async function GET(req) {
  const next = new URL(req.url).searchParams.get("next") || "/";
  const url =
    `${KAKAO_AUTH_URL}?client_id=${process.env.KAKAO_REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code&state=${encodeURIComponent(next)}`;
  // 환경변수를 바꾼 뒤에도 브라우저가 예전 client_id로 간 302 응답을 캐시해서 계속
  // 재사용하지 않도록 한다(네이버 로그인 쪽에서 겪은 것과 같은 문제 방지).
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } });
}
