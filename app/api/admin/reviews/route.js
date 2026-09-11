import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAuth";
import { setReviewHidden } from "@/lib/reviews";

export async function POST(req) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return Response.json({ ok: false, error: "권한이 없어요." }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const hidden = Boolean(body.hidden);
  if (!id) return Response.json({ ok: false, error: "잘못된 요청이에요." }, { status: 400 });

  await setReviewHidden(id, hidden);
  return Response.json({ ok: true });
}
