import { revalidateTag } from "next/cache";
import { buildLineItems } from "@/lib/orderLineItems";
import { applyRewardDiscount } from "@/lib/rewardPoints";
import { sql } from "@/lib/db";
import { getOrderStatusCounts } from "@/lib/sheet";
import { sendTelegramMessage, formatOrderNotification } from "@/lib/telegram";

// 토스 결제가 실제로 끝난(status: "DONE") 주문을 매입현황시트에 생성한다. 카드·실시간
// 계좌이체는 /api/payment/confirm에서 승인 직후 바로 호출하고, 가상계좌는 입금 전까지
// pending_card_orders에 그대로 남겨뒀다가 DEPOSIT_CALLBACK 웹훅(app/api/payment/toss-webhook)에서
// 입금 확인 후에 호출한다 — 두 경로가 같은 로직을 쓰도록 여기로 뽑아뒀다.
export async function finalizeCardOrder({ token, payload, paymentKey }) {
  const built = buildLineItems(payload.resolvedItems || []);
  const { lineItems, totalAmount, usedPoints } = applyRewardDiscount(
    built.lineItems,
    built.totalAmount,
    payload.usedPoints || 0
  );

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    throw new Error("주문 접수 연결이 설정되지 않았어요.");
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
      usedPoints,
      utmSource: payload.utmSource || "",
    }),
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error("주문 접수에 실패했어요. 결제는 완료됐으니 고객센터로 문의해주세요.");
  }
  const result = await res.json().catch(() => ({}));
  if (!result.ok) {
    throw new Error(result.error || "주문 접수에 실패했어요. 결제는 완료됐으니 고객센터로 문의해주세요.");
  }

  await sql`DELETE FROM pending_card_orders WHERE token = ${token}`;

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
          paymentLabel: payload.virtualAccount ? "🏧 가상계좌 입금완료" : "💳 카드결제완료",
          recipientName: payload.recipientName,
          recipientAddress: payload.recipientAddress,
        },
        statusCounts
      )
    );
  } catch {
    // 알림 실패해도 주문 자체엔 영향 없음
  }

  // 분석용 이벤트 기록 — 결제가 실제로 끝난 지금 기록한다(이탈·미입금 주문은 집계되지
  // 않도록). 실패해도 주문 자체는 이미 접수됐으니 응답에 영향 주지 않는다.
  try {
    await Promise.all(
      (payload.resolvedItems || [])
        .filter((it) => it.productId)
        .map((it) => {
          const qty = Number(it.qty) || 0;
          const itemAmount = (Number(it.price) || 0) * qty;
          return sql`
            INSERT INTO events (event_type, product_id, session_id, qty, amount)
            VALUES ('order_item', ${it.productId}, ${payload.visitorId || null}, ${qty}, ${itemAmount})
          `;
        })
    );
  } catch {
    // 분석 기록 실패는 무시
  }

  return { orderId: result.orderId || "", totalAmount };
}
