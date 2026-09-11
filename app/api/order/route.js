import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { resolveShippingFees } from "@/lib/shipping";
import { VISITOR_COOKIE } from "@/lib/constants";
import { sql } from "@/lib/db";

const REQUIRED_FIELDS = ["senderName", "senderAddress", "recipientName", "recipientPhone", "recipientAddress"];

export async function POST(req) {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.phone) {
    return Response.json({ ok: false, error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();

  for (const key of REQUIRED_FIELDS) {
    if (!String(body[key] || "").trim()) {
      return Response.json({ ok: false, error: "필수 항목이 비어있어요." }, { status: 400 });
    }
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return Response.json({ ok: false, error: "주문할 상품이 없어요." }, { status: 400 });
  }

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "주문 접수 연결이 아직 설정되지 않았어요 (ORDER_WEBHOOK_URL 없음)." },
      { status: 500 }
    );
  }

  const resolvedItems = resolveShippingFees(items);

  let totalAmount = 0;
  const lineItems = resolvedItems.map((it) => {
    const qty = Number(it.qty) || 0;
    const price = Number(it.price) || 0;
    const shippingFee = it.resolvedShippingFee;
    const itemTotal = price * qty + shippingFee;
    totalAmount += itemTotal;
    return {
      category: String(it.category || "").trim(),
      item: `${String(it.productName || "").trim()}${it.optionName ? ` (${it.optionName})` : ""} x${qty}`,
      qty,
      price,
      shippingFee,
      totalAmount: itemTotal,
    };
  });

  const payload = {
    senderName: String(body.senderName).trim(),
    senderPhone: session.phone,
    senderAddress: String(body.senderAddress).trim(),
    recipientName: String(body.recipientName).trim(),
    recipientPhone: String(body.recipientPhone).trim(),
    recipientAddress: String(body.recipientAddress).trim(),
    note: String(body.note || "").trim(),
    items: lineItems,
  };

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
