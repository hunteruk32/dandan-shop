import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE } from "@/lib/adminAuth";

export async function POST() {
  cookies().delete(ADMIN_SESSION_COOKIE);
  return Response.json({ ok: true });
}
