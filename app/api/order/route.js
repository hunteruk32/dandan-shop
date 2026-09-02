const REQUIRED_FIELDS = ["senderName", "senderPhone", "senderAddress", "recipientName", "recipientPhone", "recipientAddress"];

export async function POST(req) {
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

  let totalAmount = 0;
  const lineItems = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const price = Number(it.price) || 0;
    const shippingFee = Number(it.shippingFee) || 0;
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
    senderPhone: String(body.senderPhone).trim(),
    senderAddress: String(body.senderAddress).trim(),
    recipientName: String(body.recipientName).trim(),
    recipientPhone: String(body.recipientPhone).trim(),
    recipientAddress: String(body.recipientAddress).trim(),
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
  return Response.json({ ok: true, totalAmount, orderId: result.orderId || "" });
}
