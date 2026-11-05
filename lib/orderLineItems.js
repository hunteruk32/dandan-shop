// 장바구니 항목(resolveShippingFees를 거친 resolvedItems)을 매입현황시트에 보낼
// 품목 줄(lineItems) 형태로 바꾼다. 계좌이체 주문 생성과 카드결제 승인 후 주문 생성 양쪽에서
// 똑같이 쓰인다.
export function buildLineItems(resolvedItems) {
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
  return { lineItems, totalAmount };
}
