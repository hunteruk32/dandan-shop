import { sql } from "./db";
import { getOrders, getProducts, baseItemName } from "./sheet";
import { isCardTestPhone } from "./cardPayment";

// 발주 대상 판단 기준: 입금이 실제로 확인돼 배송 준비 단계로 넘어간 주문만 매입처에 발주한다.
// "입금확인중"(입금 대기)이거나 취소된 건은 제외.
const PURCHASABLE_STATUSES = new Set(["배송준비중", "배송중", "배송완료"]);

// "상품명 (옵션명) x2" 형태의 구매품목 문자열에서 수량 표기만 떼어내고
// "상품명 (옵션명)"은 그대로 남긴다 — 발주서 품목명 칸에 그대로 쓰기 위함.
function itemDisplayName(item) {
  return String(item || "").replace(/\s*x\d+$/i, "").trim();
}

// 오늘 발주해야 할 주문들을 매입처별로 묶어서 반환한다.
// 상품마스터에 매입처가 지정 안 된 상품, 이미 발주 처리(logged)된 주문 항목은 제외한다.
export async function getPendingPurchaseOrders() {
  const [orders, products] = await Promise.all([getOrders(), getProducts()]);

  const supplierByName = new Map(
    products.filter((p) => p.supplier).map((p) => [p.name, { supplier: p.supplier, productId: p.id }])
  );

  const candidates = orders
    .filter((o) => PURCHASABLE_STATUSES.has(o.orderStatus))
    // 토스 심사용 테스트 계정 주문은 실제 매입처로 발주되면 안 되므로 제외.
    .filter((o) => !isCardTestPhone(o.senderPhone))
    .map((o) => {
      const name = baseItemName(o.item);
      const match = supplierByName.get(name);
      return {
        orderId: o.id,
        orderedAt: o.orderedAt,
        orderStatus: o.orderStatus,
        item: o.item,
        itemName: itemDisplayName(o.item),
        productId: match ? match.productId : "",
        supplier: match ? match.supplier : "",
        qty: o.qty,
        senderName: o.senderName,
        senderPhone: o.senderPhone,
        senderAddress: o.senderAddress,
        recipientName: o.recipientName,
        recipientPhone: o.recipientPhone,
        recipientAddress: o.recipientAddress,
        note: o.note,
      };
    })
    .filter((c) => c.supplier);

  if (candidates.length === 0) return {};

  const logged = await sql`SELECT order_id, item_name FROM supplier_order_log`;
  const loggedKeys = new Set(logged.map((r) => `${r.order_id} ${r.item_name}`));

  const pending = candidates.filter((c) => !loggedKeys.has(`${c.orderId} ${c.item}`));

  const grouped = {};
  for (const item of pending) {
    if (!grouped[item.supplier]) grouped[item.supplier] = [];
    grouped[item.supplier].push(item);
  }
  return grouped;
}

// 발주 처리(엑셀 다운로드 또는 API 제출) 완료된 항목들을 기록해서 다음날 중복으로 안 뜨게 한다.
export async function markPurchaseOrdered(items, method) {
  for (const item of items) {
    await sql`
      INSERT INTO supplier_order_log (order_id, item_name, supplier, method)
      VALUES (${item.orderId}, ${item.item}, ${item.supplier}, ${method})
      ON CONFLICT (order_id, item_name) DO NOTHING
    `;
  }
}
