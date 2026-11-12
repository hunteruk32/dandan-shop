// 마진이 낮아 쿠폰이나 적립금을 얹으면 판매할수록 손해인 미끼 상품.
// 적립금 사용(lib/rewardPoints.js), 구매확정 적립, 가입 후 첫 주문 추가 적립의 3만원 기준
// (scripts/AppsScript.gs의 BENEFIT_EXCLUDED_PRODUCT_IDS — 같은 목록으로 유지)이 이 목록을
// 본다. 미끼 상품을 추가·제외하려면 이 Set과 AppsScript.gs의 목록을 같이 고친 뒤 웹 앱을
// 새 버전으로 배포해야 한다. 쿠폰/할인코드 기능은 아직 없다. 나중에 생기면 같은 목록으로
// 막으면 된다.
export const BENEFIT_EXCLUDED_PRODUCT_IDS = new Set(["p079", "p001"]);

// 매입현황 시트 수정이력에 남기는 표시. Apps Script가 구매확정 적립을 건너뛸 때 읽고,
// 손님 화면의 수정이력에서는 이 문구가 들어간 줄을 숨긴다.
export const REWARD_EXCLUDED_MARK = "[적립제외]";

export function isBenefitExcludedProduct(productId) {
  return BENEFIT_EXCLUDED_PRODUCT_IDS.has(String(productId || "").trim());
}
