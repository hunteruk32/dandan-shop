import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req) {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.phone) {
    return Response.json({ ok: false, error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || "").trim();
  const itemIndex = Number(body.itemIndex);
  const type = body.type;
  const reason = String(body.reason || "").trim();

  if (!orderId || !Number.isInteger(itemIndex) || itemIndex < 0 || !["cancel", "return"].includes(type)) {
    return Response.json({ ok: false, error: "잘못된 요청이에요." }, { status: 400 });
  }

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return Response.json({ ok: false, error: "요청 접수 연결이 아직 설정되지 않았어요." }, { status: 500 });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "statusRequest",
      orderId,
      requesterPhone: session.phone,
      itemIndex,
      type,
      reason,
    }),
    redirect: "follow",
  });

  if (!res.ok) {
    return Response.json({ ok: false, error: "요청 접수에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }

  const result = await res.json().catch(() => ({}));
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error || "요청을 처리할 수 없어요." }, { status: 400 });
  }

  return Response.json({ ok: true, newStatus: result.newStatus });
}
