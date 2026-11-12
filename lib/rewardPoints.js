import { isBenefitExcludedProduct } from "./benefitExclusions.js";

// 적립금을 쓰려면 최소 이 금액 이상 쌓여있어야 한다. 그 이상이면 보유액 한도 안에서
// 자유롭게 원하는 만큼만 써도 된다(특정 단위로 끊어 쓸 필요 없음).
export const REWARD_USE_THRESHOLD = 1000;

// 적립금으로 깎을 수 있는 금액. 미끼 상품(적립 제외) 줄의 상품금액·배송비는 빼지 않는다.
export function pointsEligibleAmount(lineItems) {
  return (lineItems || []).reduce((sum, it) => {
    if (isBenefitExcludedProduct(it.productId)) return sum;
    return sum + (Number(it.totalAmount) || 0);
  }, 0);
}

// 서버에서 신뢰할 수 있는 사용 가능 적립금을 계산한다. 클라이언트가 보낸 값은 그대로
// 믿지 않고, 보유 잔액/주문 금액/사용 가능 조건(최소 보유액)을 다시 확인한다.
// orderTotal에는 적립 제외 상품을 뺀 pointsEligibleAmount를 넘긴다.
export function resolveUsablePoints(availablePoints, requestedPoints, orderTotal) {
  if (availablePoints < REWARD_USE_THRESHOLD) return 0;
  const requested = Math.max(0, Math.floor(Number(requestedPoints) || 0));
  return Math.min(requested, availablePoints, orderTotal);
}

// 적립금 사용액(usedPoints)을 lineItems 합계에서 빼서 결제 금액을 줄인다. 품목별
// 합계금액(totalAmount)의 합이 항상 "실제 결제할 금액"과 같아야 하므로, 뒤쪽 품목부터
// 차례로 깎아서(한 품목이 0원 밑으로 안 내려가게) 나머지를 앞 품목에 이어서 뺀다.
// 적립 제외 상품 줄은 건너뛴다. 반환 usedPoints는 실제로 빠진 금액이다.
export function applyRewardDiscount(lineItems, totalAmount, usedPoints) {
  if (!usedPoints) return { lineItems, totalAmount, usedPoints: 0 };

  const eligible = pointsEligibleAmount(lineItems);
  let remaining = Math.min(usedPoints, totalAmount, eligible);
  if (!(remaining > 0)) return { lineItems, totalAmount, usedPoints: 0 };

  const budget = remaining;
  const discounted = lineItems
    .slice()
    .reverse()
    .map((it) => {
      if (remaining <= 0 || isBenefitExcludedProduct(it.productId)) return it;
      const cut = Math.min(remaining, it.totalAmount);
      remaining -= cut;
      return { ...it, totalAmount: it.totalAmount - cut };
    })
    .reverse();

  const applied = budget - remaining;
  return { lineItems: discounted, totalAmount: totalAmount - applied, usedPoints: applied };
}
