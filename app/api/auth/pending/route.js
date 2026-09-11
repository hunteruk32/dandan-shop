import { cookies } from "next/headers";
import { verifySessionToken } from "@/lib/auth";
import { PENDING_COOKIE } from "../kakao/callback/route";

export async function GET() {
  const pending = verifySessionToken(cookies().get(PENDING_COOKIE)?.value);
  if (!pending) return Response.json({ ok: false });
  return Response.json({ ok: true, nickname: pending.nickname || "", provider: pending.provider });
}
