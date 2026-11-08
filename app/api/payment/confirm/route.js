import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { confirmTossPayment } from "@/lib/toss";
import { buildLineItems } from "@/lib/orderLineItems";
import { VISITOR_COOKIE } from "@/lib/constants";
import { sql } from "@/lib/db";
import { getOrderStatusCounts } from "@/lib/sheet";
import { sendTelegramMessage, formatOrderNotification } from "@/lib/telegram";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const paymentKey = String(body.paymentKey || "").trim();
  const orderId = String(body.orderId || "").trim(); // /api/order가 발급한 임시 토큰
  const amount = Number(body.amount);

  if (!paymentKey || !orderId || !amount) {
    return Response.json({ ok: false, error: "잘못된 요청이에요." }, { status: 400 });
  }

  // 주문 생성을 승인 이후로 미뤘으므로(결제창 이탈 시 빈 주문이 안 남게), 아직 접수 전인
  // 상태에서는 매입현황시트에 아무 것도 없다 — 대기 중인 주문 정보부터 가져온다.
  const pending = await sql`SELECT payload FROM pending_card_orders WHERE token = ${orderId}`;
  if (pending.length === 0) {
    return Response.json({ ok: false, error: "이미 처리됐거나 잘못된 주문이에요." }, { status: 400 });
  }
  const payload = pending[0].payload;

  const { lineItems, totalAmount } = buildLineItems(payload.resolvedItems || []);
  if (totalAmount !== amount) {
    return Response.json({ ok: false, error: "결제 금액이 주문 금액과 일치하지 않아요." }, { status: 400 });
  }

  try {
    await confirmTossPayment({ paymentKey, orderId, amount });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 400 });
  }

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return Response.json({ ok: false, error: "주문 접수 연결이 설정되지 않았어요." }, { status: 500 });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderName: payload.senderName,
      senderPhone: payload.senderPhone,
      senderAddress: payload.senderAddress,
      recipientName: payload.recipientName,
      recipientPhone: payload.recipientPhone,
      recipientAddress: payload.recipientAddress,
      note: payload.note,
      items: lineItems,
      paymentMethod: "card",
      paymentKey,
    }),
    redirect: "follow",
  });

  if (!res.ok) {
    return Response.json({ ok: false, error: "주문 접수에 실패했어요. 결제는 완료됐으니 고객센터로 문의해주세요." }, { status: 502 });
  }
  const result = await res.json().catch(() => ({}));
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error || "주문 접수에 실패했어요. 결제는 완료됐으니 고객센터로 문의해주세요." }, { status: 502 });
  }

  await sql`DELETE FROM pending_card_orders WHERE token = ${orderId}`;

  // Apps Script의 외부 요청 권한에 기대지 않고, 웹훅 성공을 확인한 이 서버에서 바로 캐시를
  // 갱신한다 — "내 주문 확인"이 60초 캐시를 기다리지 않게 하기 위함.
  revalidateTag("orders");

  // 텔레그램 주문 알림 — 설정 안 해놨으면 조용히 건너뛴다.
  try {
    const statusCounts = await getOrderStatusCounts();
    await sendTelegramMessage(
      formatOrderNotification(
        {
          senderName: payload.senderName,
          senderPhone: payload.senderPhone,
          lineItems,
          totalAmount,
          paymentLabel: "💳 카드결제완료",
          recipientName: payload.recipientName,
          recipientAddress: payload.recipientAddress,
        },
        statusCounts
      )
    );
  } catch {
    // 알림 실패해도 주문 자체엔 영향 없음
  }

  // 분석용 이벤트 기록 — 카드결제는 승인이 실제로 확정된 지금 기록한다(이탈·실패 결제는
  // 집계되지 않도록). 실패해도 주문 자체는 이미 접수됐으니 응답에 영향 주지 않는다.
  try {
    const visitorId = cookies().get(VISITOR_COOKIE)?.value || null;
    await Promise.all(
      (payload.resolvedItems || [])
        .filter((it) => it.productId)
        .map((it) => {
          const qty = Number(it.qty) || 0;
          const itemAmount = (Number(it.price) || 0) * qty;
          return sql`
            INSERT INTO events (event_type, product_id, session_id, qty, amount)
            VALUES ('order_item', ${it.productId}, ${visitorId}, ${qty}, ${itemAmount})
          `;
        })
    );
  } catch {
    // 분석 기록 실패는 무시
  }

  return Response.json({ ok: true, orderId: result.orderId || "" });
}
