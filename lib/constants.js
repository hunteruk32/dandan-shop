// 방문자를 구분하기 위한 익명 세션 쿠키 이름. middleware.js와 트래킹 API가 공유한다.
export const VISITOR_COOKIE = "dandan_sid";

// 첫 유입 시의 utm_source를 저장하는 쿠키. middleware.js가 최초 1회만 기록하고,
// 이후 주문 접수(app/api/order)에서 읽어서 주문과 함께 남긴다.
export const UTM_SOURCE_COOKIE = "dandan_utm_source";
