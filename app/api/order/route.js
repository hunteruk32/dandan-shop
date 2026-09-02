const REQUIRED_FIELDS = [
  "senderName",
  "senderPhone",
  "senderAddress",
  "recipientName",
  "recipientPhone",
  "recipientAddress",
  "category",
  "item",
  "qty",
  "price",
];

export async function POST(req) {
  const body = await req.json();

  for (const key of REQUIRED_FIELDS) {
    if (!body[key] && body[key] !== 0) {
      return Response.json({ ok: false, error: "필수 항목이 비어있어요." }, { status: 400 });
    }
  }

  const url = process.env.ORDER_WEBHOOK_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "주문 접수 연결이 아직 설정되지 않았어요 (ORDER_WEBHOOK_URL 없음)." },
      { status: 500 }
    );
  }

  const qty = Number(body.qty) || 0;
  const price = Number(body.price) || 0;
  const shippingFee = Number(body.shippingFee) || 0;
  const totalAmount = price * qty + shippingFee;

  const payload = {
    senderName: String(body.senderName).trim(),
    senderPhone: String(body.senderPhone).trim(),
    senderAddress: String(body.senderAddress).trim(),
    recipientName: String(body.recipientName).trim(),
    recipientPhone: String(body.recipientPhone).trim(),
    recipientAddress: String(body.recipientAddress).trim(),
    category: String(body.category).trim(),
    item: String(body.item).trim(),
    qty,
    price,
    shippingFee,
    totalAmount,
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
