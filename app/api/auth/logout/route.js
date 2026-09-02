import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  cookies().set(SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return Response.json({ ok: true });
}
