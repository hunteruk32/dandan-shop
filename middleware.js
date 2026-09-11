import { NextResponse } from "next/server";
import { VISITOR_COOKIE } from "@/lib/constants";

const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1년

export function middleware(req) {
  const hasSid = req.cookies.get(VISITOR_COOKIE)?.value;
  if (hasSid) return NextResponse.next();

  const res = NextResponse.next();
  res.cookies.set(VISITOR_COOKIE, crypto.randomUUID(), {
    maxAge: VISITOR_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)"],
};
