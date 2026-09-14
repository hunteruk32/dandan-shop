import { confirmTossPayment } from "@/lib/toss";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const paymentKey = String(body.paymentKey || "").trim();
  const orderId = String(body.orderId || "").trim();
  const amount = Number(body.amount);

  if (!paymentKey || !orderId || !amount) {
    return Response.json({ ok: false, error: "잘못된 요청이에요." }, { status: 400 });
  }

  try {
    await confirmTossPayment({ paymentKey, orderId, amount });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 400 });
  }

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return Response.json({ ok: false, error: "주문 상태 갱신 연결이 설정되지 않았어요." }, { status: 500 });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "confirmCardPayment", orderId, paymentKey, amount }),
    redirect: "follow",
  });
  const result = await res.json().catch(() => ({}));
  if (!res.ok || !result.ok) {
    return Response.json({ ok: false, error: result.error || "주문 상태 갱신에 실패했어요." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
