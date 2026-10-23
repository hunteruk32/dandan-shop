// 젓갈류는 낱개 배송비 대신, 장바구니에 담긴 젓갈류 전체 무게로 합배송비를 한 번만 매긴다.
export const COMBINED_SHIPPING_CATEGORY = "젓갈";
export const COMBINED_SHIPPING_WEIGHT_THRESHOLD_G = 5000;
export const COMBINED_SHIPPING_FEE_LIGHT = 3000; // 5kg 이하
export const COMBINED_SHIPPING_FEE_HEAVY = 5000; // 5kg 초과

// 이 상품들은 옵션을 여러 개 담거나 수량을 몇 개를 담든, 상품 하나당 배송비를 한 번만 매긴다
// (옵션별로 장바구니 줄이 나뉘어도 같은 상품이면 합산하지 않음).
export const SINGLE_SHIPPING_PRODUCT_IDS = new Set(["p101"]);

// 이 상품들은 다른 상품과 함께 묶음배송될 때(장바구니에 다른 상품이 더 있을 때)
// 별도 박스 포장이 필요해서 박스비를 한 번(상품당) 추가로 매긴다.
export const BUNDLE_BOX_FEE_PRODUCT_IDS = { p105: 2000 };

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

  const productIds = new Set(items.map((i) => i.productId));

  // 상품별 합배송 박스 수 계산용 — 옵션별로 장바구니 줄이 나뉘어도 같은 상품 수량은 합쳐서 센다.
  const qtyByProductId = {};
  for (const i of items) {
    if (!i.productId) continue;
    qtyByProductId[i.productId] = (qtyByProductId[i.productId] || 0) + (Number(i.qty) || 0);
  }

  let combinedFeeAssigned = false;
  const singleFeeAssigned = new Set();
  const boxFeeAssigned = new Set();
  const combinedQtyFeeAssigned = new Set();
  return items.map((item) => {
    if (item.category === COMBINED_SHIPPING_CATEGORY) {
      const resolvedShippingFee = combinedFeeAssigned ? 0 : combinedFee;
      combinedFeeAssigned = true;
      return { ...item, resolvedShippingFee };
    }
    if (SINGLE_SHIPPING_PRODUCT_IDS.has(item.productId)) {
      const resolvedShippingFee = singleFeeAssigned.has(item.productId) ? 0 : Number(item.shippingFee) || 0;
      singleFeeAssigned.add(item.productId);
      return { ...item, resolvedShippingFee };
    }

    const baseFee = Number(item.shippingFee) || 0;

    // 택배비 별도 상품 중 합배송 가능 수량이 지정된 경우: 전체 수량을 그 수량으로 나눠
    // 올림한 박스 수만큼 배송비를 매긴다(상품당 한 번만 계산, 나머지 줄은 0원).
    const combinedQty = Number(item.combinedShippingQty) || 0;
    if (combinedQty > 0 && item.productId) {
      if (combinedQtyFeeAssigned.has(item.productId)) {
        return { ...item, resolvedShippingFee: 0 };
      }
      combinedQtyFeeAssigned.add(item.productId);
      const totalQty = qtyByProductId[item.productId] || 0;
      const boxes = Math.max(1, Math.ceil(totalQty / combinedQty));
      return { ...item, resolvedShippingFee: baseFee * boxes };
    }

    const boxFee = BUNDLE_BOX_FEE_PRODUCT_IDS[item.productId];
    if (boxFee && productIds.size > 1 && !boxFeeAssigned.has(item.productId)) {
      boxFeeAssigned.add(item.productId);
      return { ...item, resolvedShippingFee: baseFee + boxFee };
    }
    return { ...item, resolvedShippingFee: baseFee };
  });
}

export function calcShippingTotal(items) {
  return resolveShippingFees(items).reduce((sum, i) => sum + i.resolvedShippingFee, 0);
}
