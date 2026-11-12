// GA4/구글애즈 전환 이벤트를 안전하게 보낸다.
//
// window.gtag는 app/layout.jsx의 afterInteractive 스크립트가 로드된 뒤에야 생기는데,
// 체크아웃처럼 페이지 진입 직후 바로 제출이 일어날 수 있는 화면에서는 그 스크립트가
// 아직 실행되기 전일 수 있다. 그때 "typeof window.gtag === 'function'"만 확인하고
// 끝내면 이벤트가 그냥 버려진다. gtag() 내부도 결국 dataLayer.push(arguments)만 할
// 뿐이므로, window.gtag 존재 여부와 상관없이 dataLayer에 직접 push하면 gtag.js가
// 나중에 로드되더라도 쌓여있는 호출을 그대로 처리한다 — 구글이 공식적으로 지원하는
// "라이브러리 로드 전 호출 큐잉" 방식과 동일하다.
function gtagSend(...args) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

const AW_CONVERSION_SEND_TO = "AW-18369032939/qjyfCIuoyfIcEOvlhLdE";

// 구글애즈 전환(conversion) + GA4 purchase 이벤트를 함께 보낸다.
// transactionId가 없으면(웹훅 실패 등으로 주문번호를 못 받은 경우) 아예 보내지 않는다 —
// 주문번호가 아닌 임시값으로 보내면 전환 추적도, 새로고침 중복 방지도 믿을 수 없다.
export function trackPurchase({ transactionId, value, currency = "KRW" }) {
  if (typeof window === "undefined" || !transactionId) return;

  // 같은 주문(transaction_id)은 같은 브라우저에서 한 번만 보낸다 — 성공 화면을
  // 새로고침하거나 뒤로가기 후 다시 들어와도 중복 집계되지 않게.
  const dedupeKey = "dandan-purchase-sent-" + transactionId;
  try {
    if (sessionStorage.getItem(dedupeKey)) return;
    sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // 세션스토리지 접근이 막혀있어도(시크릿 모드 등) 전송 자체는 계속 진행한다.
  }

  gtagSend("event", "conversion", {
    send_to: AW_CONVERSION_SEND_TO,
    value,
    currency,
    transaction_id: transactionId,
  });
  gtagSend("event", "purchase", {
    transaction_id: transactionId,
    value,
    currency,
  });
}
