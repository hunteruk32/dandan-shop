// 손님 화면 컴포넌트도 import한다. 매입처·시트 로딩 코드는 여기 두지 않는다.

export const CATEGORIES = ["선물세트", "수산물", "농산물", "축산물", "김치", "젓갈", "과일", "가공식품", "기타"];

// 상품 상태 배지 — 색을 쓰지 않고 테두리·글자색 톤만 다르게 구분한다.
export const STATUS_STYLE = {
  주문가능: { fg: "#111111", border: "#333333" },
  품절: { fg: "#767676", border: "#D9D9D9" },
  시즌종료: { fg: "#767676", border: "#D9D9D9" },
};

// 발주 상태 배지 — 색은 쓰지 않고, 톤(채움/테두리/흐림) 3단계로만 구분한다.
// 진행 중 = 테두리, 완료 = 채움(ink), 취소·반품 = 흐림(회색).
const TONE_OUTLINE = { bg: "#fff", fg: "var(--ink)", border: "var(--ink)" };
const TONE_FILL = { bg: "var(--ink)", fg: "var(--bg)", border: "var(--ink)" };
const TONE_MUTED = { bg: "var(--bg-soft)", fg: "var(--muted)", border: "var(--line)" };

// 목록에 없는 값(직접 입력한 값 등)은 기본 색으로 표시된다.
export const ORDER_STATUS_STYLE = {
  입금확인중: TONE_OUTLINE,
  배송준비중: TONE_OUTLINE,
  배송중: TONE_OUTLINE,
  배송완료: TONE_FILL,
  구매확정: TONE_FILL,
  취소중: TONE_MUTED,
  취소완료: TONE_MUTED,
  반품중: TONE_MUTED,
  반품완료: TONE_MUTED,
  교환중: TONE_OUTLINE,
  교환완료: TONE_OUTLINE,
};
export const ORDER_STATUS_DEFAULT_STYLE = TONE_OUTLINE;
