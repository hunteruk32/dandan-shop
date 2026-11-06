// 손님 화면 컴포넌트도 import한다. 매입처·시트 로딩 코드는 여기 두지 않는다.

export const CATEGORIES = ["선물세트", "수산물", "농산물", "축산물", "김치", "젓갈", "과일", "가공식품", "기타"];

export const STATUS_STYLE = {
  주문가능: { bg: "#E9F3EC", fg: "#2F6F4E" },
  품절: { bg: "#EFEDE7", fg: "#8A8172" },
  시즌종료: { bg: "#FBEFE6", fg: "#C0511F" },
};

// 발주 상태 배지 색상. 목록에 없는 값(직접 입력한 값 등)은 기본 색으로 표시된다.
export const ORDER_STATUS_STYLE = {
  입금확인중: { bg: "#FBEFE6", fg: "#C0511F" },
  배송준비중: { bg: "#FBEFE6", fg: "#C0511F" },
  배송중: { bg: "#FBEFE6", fg: "#C0511F" },
  배송완료: { bg: "#E9F3EC", fg: "#2F6F4E" },
  구매확정: { bg: "#E6F3FA", fg: "#1F6FA3" },
  취소중: { bg: "#EFEDE7", fg: "#8A8172" },
  취소완료: { bg: "#EFEDE7", fg: "#8A8172" },
  반품중: { bg: "#F7E6E6", fg: "#B23A3A" },
  반품완료: { bg: "#F7E6E6", fg: "#B23A3A" },
  교환중: { bg: "#EFE6F7", fg: "#6B3AB2" },
  교환완료: { bg: "#EFE6F7", fg: "#6B3AB2" },
};
export const ORDER_STATUS_DEFAULT_STYLE = { bg: "#fff", fg: "#C0511F" };
