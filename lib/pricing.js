// 정가(list price) 대비 할인율 계산. 정가가 없거나 실제 판매가보다 낮거나 같으면 할인이 아니므로 null.
export function getDiscount(listPrice, price) {
  if (!listPrice || listPrice <= price) return null;
  const rate = Math.round((1 - price / listPrice) * 100);
  if (rate <= 0) return null;
  return { listPrice, rate };
}

// 목록 카드의 "~원부터"는 상품 대표 등급과 다른(예: 찌개용처럼 등급이 낮은) 옵션의
// 가격이 아니라, 대표 등급 옵션 중 최저가로 보여준다. 찌개용 옵션의 실제 가격 자체는
// 바꾸지 않고, 카드에 뜨는 시작가 계산에서만 뺀다. 상품 전체가 찌개용 옵션뿐이면(예외
// 상황) 제외하지 않고 전체 중 최저가를 그대로 쓴다.
const LOWER_GRADE_OPTION_RE = /찌개/;

export function getDisplayStartOption(options) {
  const list = options || [];
  if (list.length === 0) return null;
  const graded = list.filter((o) => !LOWER_GRADE_OPTION_RE.test(o.name || ""));
  const pool = graded.length > 0 ? graded : list;
  return pool.reduce((min, o) => (o.price < min.price ? o : min), pool[0]);
}
