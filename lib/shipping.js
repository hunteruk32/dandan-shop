// 젓갈류는 낱개 배송비 대신, 장바구니에 담긴 젓갈류 전체 무게로 합배송비를 한 번만 매긴다.
export const COMBINED_SHIPPING_CATEGORY = "젓갈";
export const COMBINED_SHIPPING_WEIGHT_THRESHOLD_G = 5000;
export const COMBINED_SHIPPING_FEE_LIGHT = 3000; // 5kg 이하
export const COMBINED_SHIPPING_FEE_HEAVY = 5000; // 5kg 초과

function combinedFeeForWeight(totalWeightG) {
  return totalWeightG <= COMBINED_SHIPPING_WEIGHT_THRESHOLD_G
    ? COMBINED_SHIPPING_FEE_LIGHT
    : COMBINED_SHIPPING_FEE_HEAVY;
}

// items: [{ category, qty, shippingFee, weightG }]
// 각 항목에 실제로 청구할 배송비(resolvedShippingFee)를 붙여서 반환한다.
// 젓갈류는 합산 무게로 계산한 배송비를 첫 항목에만 몰아주고 나머지는 0원 처리한다.
export function resolveShippingFees(items) {
  const combinedWeight = items
    .filter((i) => i.category === COMBINED_SHIPPING_CATEGORY)
    .reduce((sum, i) => sum + (Number(i.weightG) || 0) * (Number(i.qty) || 0), 0);
  const combinedFee = combinedWeight > 0 ? combinedFeeForWeight(combinedWeight) : 0;

  let combinedFeeAssigned = false;
  return items.map((item) => {
    if (item.category === COMBINED_SHIPPING_CATEGORY) {
      const resolvedShippingFee = combinedFeeAssigned ? 0 : combinedFee;
      combinedFeeAssigned = true;
      return { ...item, resolvedShippingFee };
    }
    return { ...item, resolvedShippingFee: Number(item.shippingFee) || 0 };
  });
}

export function calcShippingTotal(items) {
  return resolveShippingFees(items).reduce((sum, i) => sum + i.resolvedShippingFee, 0);
}
