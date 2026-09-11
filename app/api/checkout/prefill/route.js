import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getLastSenderInfo } from "@/lib/sheet";

export async function GET() {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.phone) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const info = await getLastSenderInfo(session.phone);
  return Response.json({ ok: true, senderName: info?.senderName || "", senderAddress: info?.senderAddress || "" });
}
