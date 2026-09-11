import { cookies } from "next/headers";
import { verifySessionToken, PENDING_COOKIE } from "@/lib/auth";

export async function GET() {
  const pending = verifySessionToken(cookies().get(PENDING_COOKIE)?.value);
  if (!pending) return Response.json({ ok: false });
  return Response.json({ ok: true, nickname: pending.nickname || "", provider: pending.provider });
}
