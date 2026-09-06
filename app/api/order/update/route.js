import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req) {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.phone) {
    return Response.json({ ok: false, error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();
  const orderId = String(body.orderId || "").trim();
  const recipientName = String(body.recipientName || "").trim();
  const recipientPhone = String(body.recipientPhone || "").trim();
  const recipientAddress = String(body.recipientAddress || "").trim();
  const note = String(body.note || "").trim();

  if (!orderId || !recipientName || !recipientPhone || !recipientAddress) {
    return Response.json({ ok: false, error: "필수 항목이 비어있어요." }, { status: 400 });
  }

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "주문 수정 연결이 아직 설정되지 않았어요 (ORDER_WEBHOOK_URL 없음)." },
      { status: 500 }
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "update",
      orderId,
      requesterPhone: session.phone,
      recipientName,
      recipientPhone,
      recipientAddress,
      note,
    }),
    redirect: "follow",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    return Response.json({ ok: false, error: data.error || "수정에 실패했어요." }, { status: res.ok ? 400 : 502 });
  }

  return Response.json(data);
}
