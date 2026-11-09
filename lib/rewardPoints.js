// 적립금을 쓰려면 최소 이 금액 이상 쌓여있어야 한다. 그 이상이면 보유액 한도 안에서
// 자유롭게 원하는 만큼만 써도 된다(5000원 단위로 끊어 쓸 필요 없음).
export const REWARD_USE_THRESHOLD = 5000;

// 서버에서 신뢰할 수 있는 사용 가능 적립금을 계산한다. 클라이언트가 보낸 값은 그대로
// 믿지 않고, 보유 잔액/주문 금액/사용 가능 조건(최소 보유액)을 다시 확인한다.
export function resolveUsablePoints(availablePoints, requestedPoints, orderTotal) {
  if (availablePoints < REWARD_USE_THRESHOLD) return 0;
  const requested = Math.max(0, Math.floor(Number(requestedPoints) || 0));
  return Math.min(requested, availablePoints, orderTotal);
}

// 적립금 사용액(usedPoints)을 lineItems 합계에서 빼서 결제 금액을 줄인다. 품목별
// 합계금액(totalAmount)의 합이 항상 "실제 결제할 금액"과 같아야 하므로, 뒤쪽 품목부터
// 차례로 깎아서(한 품목이 0원 밑으로 안 내려가게) 나머지를 앞 품목에 이어서 뺀다.
export function applyRewardDiscount(lineItems, totalAmount, usedPoints) {
  if (!usedPoints) return { lineItems, totalAmount };

  let remaining = Math.min(usedPoints, totalAmount);
  const discounted = lineItems
    .slice()
    .reverse()
    .map((it) => {
      if (remaining <= 0) return it;
      const cut = Math.min(remaining, it.totalAmount);
      remaining -= cut;
      return { ...it, totalAmount: it.totalAmount - cut };
    })
    .reverse();

  return { lineItems: discounted, totalAmount: totalAmount - Math.min(usedPoints, totalAmount) };
}
