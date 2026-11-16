import { cookies } from "next/headers";
import { confirmTossPayment } from "@/lib/toss";
import { applyRewardDiscount } from "@/lib/rewardPoints";
import { buildLineItems } from "@/lib/orderLineItems";
import { VISITOR_COOKIE } from "@/lib/constants";
import { sql } from "@/lib/db";
import { finalizeCardOrder } from "@/lib/cardOrderFinalize";

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

  const built = buildLineItems(payload.resolvedItems || []);
  const { totalAmount } = applyRewardDiscount(built.lineItems, built.totalAmount, payload.usedPoints || 0);
  if (totalAmount !== amount) {
    return Response.json({ ok: false, error: "결제 금액이 주문 금액과 일치하지 않아요." }, { status: 400 });
  }

  let confirmed;
  try {
    confirmed = await confirmTossPayment({ paymentKey, orderId, amount });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 400 });
  }

  const visitorId = cookies().get(VISITOR_COOKIE)?.value || null;

  // 가상계좌는 승인 API를 호출해도 계좌가 발급된 것이지 입금이 끝난 게 아니다(status가
  // "WAITING_FOR_DEPOSIT"). 실제로 입금되면 토스가 DEPOSIT_CALLBACK 웹훅으로 알려주므로
  // (app/api/payment/toss-webhook 참고), 그때까지는 매입현황시트에 주문을 만들지 않고
  // pending_card_orders에 결제 정보(secret·가상계좌 정보)만 더 채워서 계속 보관한다.
  if (confirmed.status === "WAITING_FOR_DEPOSIT") {
    await sql`
      UPDATE pending_card_orders
      SET payload = payload || ${JSON.stringify({
        paymentKey,
        secret: confirmed.secret,
        virtualAccount: confirmed.virtualAccount,
        visitorId,
      })}::jsonb
      WHERE token = ${orderId}
    `;
    return Response.json({ ok: true, pending: true, virtualAccount: confirmed.virtualAccount });
  }

  if (confirmed.status !== "DONE") {
    return Response.json({ ok: false, error: `알 수 없는 결제 상태예요 (${confirmed.status}).` }, { status: 400 });
  }

  try {
    const { orderId: sheetOrderId } = await finalizeCardOrder({
      token: orderId,
      payload: { ...payload, visitorId },
      paymentKey,
    });
    return Response.json({ ok: true, orderId: sheetOrderId });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 502 });
  }
}
