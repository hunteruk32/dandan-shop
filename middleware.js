import { NextResponse } from "next/server";
import { VISITOR_COOKIE, UTM_SOURCE_COOKIE } from "@/lib/constants";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1년
// 영문자/숫자/밑줄만 허용 — 쿼리스트링에 엉뚱한 값이 들어와도 쿠키·시트에 그대로 안 쌓이게.
const UTM_SOURCE_RE = /^[a-z0-9_]{1,40}$/i;

export function middleware(req) {
  const hasSid = req.cookies.get(VISITOR_COOKIE)?.value;
  const hasUtmSource = req.cookies.get(UTM_SOURCE_COOKIE)?.value;
  const utmSource = req.nextUrl.searchParams.get("utm_source");
  const shouldSetUtm = !hasUtmSource && utmSource && UTM_SOURCE_RE.test(utmSource);

  if (hasSid && !shouldSetUtm) return NextResponse.next();

  const res = NextResponse.next();
  if (!hasSid) {
    res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  // 첫 유입 출처만 기록한다 — 이후 다른 utm_source로 재방문해도 덮어쓰지 않는다.
  if (shouldSetUtm) {
    res.cookies.set(UTM_SOURCE_COOKIE, utmSource, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
