const NAVER_AUTH_URL = "https://nid.naver.com/oauth2.0/authorize";
const REDIRECT_URI = "https://dandan-shop.co.kr/api/auth/naver/callback";

export async function GET(req) {
  const next = new URL(req.url).searchParams.get("next") || "/";
  const url =
    `${NAVER_AUTH_URL}?response_type=code&client_id=${process.env.NAVER_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${encodeURIComponent(next)}`;
  // 환경변수를 바꾼 뒤에도 브라우저가 예전 client_id로 간 302 응답을 캐시해서 계속
  // 재사용하는 걸 막는다(한 번 잘못된 설정으로 접속했던 PC가 "캐시 안 됐을 땐 되는데
  // 캐시된 뒤로는 계속 에러" 같은 혼란을 일으킬 수 있음).
  return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "no-store" } });
}
