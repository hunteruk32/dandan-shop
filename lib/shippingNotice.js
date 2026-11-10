// 손님에게 보여주는 공통 발송 안내.
// 주문 마감은 상품마다 다르지 않다. 상품 설명이나 시트 마감 열에서
// 문장을 뽑아 쓰지 않고, 모든 상품에 같은 문구를 붙인다.

export const SAME_DAY_SHIPPING_NOTICE = "오전 7시까지 주문하시면 당일 발송해요.";

export const ISLAND_SHIPPING_NOTICE = "제주·도서산간 지역은 배송이 불가해요.";

export const CUTOFF_COLUMN_KEYS = [
  "shipping_cutoff",
  "cutoff",
  "order_deadline",
  "발송마감",
  "마감시간",
  "배송마감",
  "배송마감시간",
];

export function readShippingCutoffCell(row) {
  if (!row) return "";
  for (const key of CUTOFF_COLUMN_KEYS) {
    const value = String(row[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}
