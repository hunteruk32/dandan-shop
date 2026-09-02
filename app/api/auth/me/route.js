import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  return Response.json({ phone: session?.phone || null });
}
