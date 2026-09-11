// 정가(list price) 대비 할인율 계산. 정가가 없거나 실제 판매가보다 낮거나 같으면 할인이 아니므로 null.
export function getDiscount(listPrice, price) {
  if (!listPrice || listPrice <= price) return null;
  const rate = Math.round((1 - price / listPrice) * 100);
  if (rate <= 0) return null;
  return { listPrice, rate };
}
