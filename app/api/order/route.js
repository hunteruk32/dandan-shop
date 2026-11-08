import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { randomUUID } from "crypto";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { resolveShippingFees } from "@/lib/shipping";
import { buildLineItems } from "@/lib/orderLineItems";
import { VISITOR_COOKIE } from "@/lib/constants";
import { sql } from "@/lib/db";
import { isCardPaymentAllowed } from "@/lib/cardPayment";
import { getProducts, getOrderStatusCounts } from "@/lib/sheet";
import { sendTelegramMessage, formatOrderNotification } from "@/lib/telegram";

const REQUIRED_FIELDS = ["senderName", "senderAddress", "recipientName", "recipientPhone", "recipientAddress"];

export async function POST(req) {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.phone) {
    return Response.json({ ok: false, error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();
  const isCard = body.paymentMethod === "card";

  if (isCard && !isCardPaymentAllowed(session.phone)) {
    return Response.json({ ok: false, error: "카드결제는 아직 준비 중이에요. 계좌이체로 주문해주세요." }, { status: 403 });
  }

  for (const key of REQUIRED_FIELDS) {
    if (!String(body[key] || "").trim()) {
      return Response.json({ ok: false, error: "필수 항목이 비어있어요." }, { status: 400 });
    }
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return Response.json({ ok: false, error: "주문할 상품이 없어요." }, { status: 400 });
  }

  // 클라이언트가 품절·시즌종료 상품을 끼워 보내는 경우를 막기 위해 서버에서도 현재 상태를 다시 확인한다.
  const products = await getProducts();
  const statusById = new Map(products.map((p) => [p.id, p.status]));
  const blocked = items.find((it) => it.productId && statusById.get(it.productId) !== "주문가능");
  if (blocked) {
    return Response.json({ ok: false, error: `${blocked.productName || "상품"}은(는) 지금 주문할 수 없어요.` }, { status: 409 });
  }

  const resolvedItems = resolveShippingFees(items);

  const senderInfo = {
    senderName: String(body.senderName).trim(),
    senderPhone: session.phone,
    senderAddress: String(body.senderAddress).trim(),
    recipientName: String(body.recipientName).trim(),
    recipientPhone: String(body.recipientPhone).trim(),
    recipientAddress: String(body.recipientAddress).trim(),
    note: String(body.note || "").trim(),
  };

  if (isCard) {
    // 카드결제는 실제 승인이 끝난 뒤에만 매입현황시트에 주문을 만든다 — 지금은 토스 결제창에
    // 넘길 임시 토큰만 발급해서 주문에 필요한 정보(resolvedItems — productId가 남아있어야
    // 나중에 분석 이벤트도 기록할 수 있다)를 잠깐 저장해두고, 승인되면
    // /api/payment/confirm이 이 내용으로 주문을 생성한다. (결제창을 닫고 나가거나
    // 실패해도 시트에 "결제 안 한 주문"이 안 남게 하기 위함)
    const { totalAmount } = buildLineItems(resolvedItems);
    const token = "card_" + randomUUID().replace(/-/g, "");
    const pendingPayload = { ...senderInfo, resolvedItems };
    await sql`
      INSERT INTO pending_card_orders (token, payload)
      VALUES (${token}, ${JSON.stringify(pendingPayload)}::jsonb)
    `;
    return Response.json({ ok: true, totalAmount, orderId: token });
  }

  const { lineItems, totalAmount } = buildLineItems(resolvedItems);
  const payload = { ...senderInfo, items: lineItems, paymentMethod: "bank" };

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "주문 접수 연결이 아직 설정되지 않았어요 (ORDER_WEBHOOK_URL 없음)." },
      { status: 500 }
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow",
  });

  if (!res.ok) {
    return Response.json({ ok: false, error: "주문 접수에 실패했어요. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }

  const result = await res.json().catch(() => ({}));

  // Apps Script의 외부 요청 권한(스크립트 속성 설정)에 기대지 않고, 웹훅 성공을 확인한
  // 이 서버에서 바로 캐시를 갱신한다 — "내 주문 확인"이 60초 캐시를 기다리지 않게 하기 위함.
  revalidateTag("orders");

  // 텔레그램 주문 알림 — 설정 안 해놨으면 조용히 건너뛴다.
  try {
    const statusCounts = await getOrderStatusCounts();
    await sendTelegramMessage(
      formatOrderNotification(
        {
          senderName: senderInfo.senderName,
          senderPhone: senderInfo.senderPhone,
          lineItems,
          totalAmount,
          paymentLabel: "🏦 계좌이체 (입금확인 필요)",
          recipientName: senderInfo.recipientName,
          recipientAddress: senderInfo.recipientAddress,
        },
        statusCounts
      )
    );
  } catch {
    // 알림 실패해도 주문 자체엔 영향 없음
  }

  // 분석용 이벤트 기록 — 실패해도 주문 자체는 이미 접수됐으니 응답에 영향 주지 않는다.
  try {
    const visitorId = cookies().get(VISITOR_COOKIE)?.value || null;
    await Promise.all(
      resolvedItems
        .filter((it) => it.productId)
        .map((it) => {
          const qty = Number(it.qty) || 0;
          const amount = (Number(it.price) || 0) * qty;
          return sql`
            INSERT INTO events (event_type, product_id, session_id, qty, amount)
            VALUES ('order_item', ${it.productId}, ${visitorId}, ${qty}, ${amount})
          `;
        })
    );
  } catch {
    // 분석 기록 실패는 무시
  }

  return Response.json({ ok: true, totalAmount, orderId: result.orderId || "" });
}
