import { sql } from "@/lib/db";
import { finalizeCardOrder } from "@/lib/cardOrderFinalize";
import { sendTelegramMessage } from "@/lib/telegram";

// 토스페이먼츠 DEPOSIT_CALLBACK 웹훅 — 가상계좌 입금 상태가 바뀔 때마다(입금 완료,
// 입금 오류로 인한 취소 등) 호출된다. 개발자센터(developers.tosspayments.com/my/webhooks)에
// 이 라우트의 URL을 등록해야 실제로 호출받는다.
//
// 이벤트 본문: { createdAt, secret, status, transactionKey, orderId }
// orderId는 /api/order가 발급한 임시 토큰(pending_card_orders.token)과 같은 값이다.

// 개발자센터에서 웹훅 등록할 때 URL이 살아있는지 확인하려고 GET으로 먼저 찔러볼 수 있어서
// (POST만 있으면 405가 나서 등록 자체가 실패할 수 있다), 아무 것도 안 하고 200만 준다.
export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const orderId = String(body.orderId || "").trim();
  const status = String(body.status || "").trim();
  const secret = String(body.secret || "").trim();

  // 웹훅 등록 시 토스가 보내는 테스트/검증 요청은 orderId가 없을 수 있다 — 이런 요청을
  // 에러로 응답하면 개발자센터에서 웹훅 등록 자체가 실패하므로, 조용히 200으로 받아준다.
  if (!orderId) {
    return Response.json({ ok: true, skipped: "no_order_id" });
  }

  const pending = await sql`SELECT payload FROM pending_card_orders WHERE token = ${orderId}`;
  if (pending.length === 0) {
    // 이미 처리됐거나(입금 완료로 이미 지워짐) 모르는 주문 — 토스가 재시도하지 않도록 200으로 응답.
    return Response.json({ ok: true, skipped: "not_pending" });
  }
  const payload = pending[0].payload;

  // 결제 승인 응답으로 받았던 secret과 웹훅 본문의 secret이 같아야 토스페이먼츠에서 보낸
  // 정상 요청이다. 다르면 위조된 요청일 수 있으니 처리하지 않는다.
  if (!payload.secret || payload.secret !== secret) {
    return Response.json({ ok: false, error: "secret이 일치하지 않아요." }, { status: 401 });
  }

  if (status === "DONE") {
    try {
      await finalizeCardOrder({ token: orderId, payload, paymentKey: payload.paymentKey });
    } catch (err) {
      // 실패하면 토스가 재시도할 수 있게 5xx로 응답한다.
      return Response.json({ ok: false, error: err.message }, { status: 502 });
    }
    return Response.json({ ok: true });
  }

  // 입금 오류로 취소되는 등(DONE이 아닌 다른 상태로 바뀜) — 실제 돈이 걸린 일이라 사람이
  // 확인해야 하므로 주문은 만들지 않고 텔레그램으로만 알린다.
  try {
    await sendTelegramMessage(
      `⚠️ 가상계좌 입금 상태 변경 (처리 안 됨)\n주문토큰: ${orderId}\n상태: ${status}\n확인해주세요.`
    );
  } catch {
    // 알림 실패해도 웹훅 응답엔 영향 없음
  }

  return Response.json({ ok: true, skipped: status });
}
