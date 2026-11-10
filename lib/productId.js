// 상품 id는 항상 "p" + 숫자(p027, p098 …) 형태다. 깨진/악의적 링크(봇, 이중 인코딩된 URL 등)로
// 들어온 분석 이벤트가 이 형식이 아닌 문자열을 product_id로 저장해서 관리자 통계를 오염시키는 걸 막는다.
const PRODUCT_ID_RE = /^p\d+$/;

export function isValidProductId(id) {
  return PRODUCT_ID_RE.test(String(id || ""));
}
