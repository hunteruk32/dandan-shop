const digits = (s) => String(s || "").replace(/[^0-9]/g, "");

// 서버·클라이언트 양쪽에서 쓰는 순수 함수(crypto 등 서버 전용 모듈을 import하지 않는다).
export function getCardTestPhones() {
  return String(process.env.NEXT_PUBLIC_CARD_PAYMENT_TEST_PHONES || "")
    .split(",")
    .map(digits)
    .filter(Boolean);
}

export function isCardTestPhone(phone) {
  const p = digits(phone);
  return Boolean(p) && getCardTestPhones().includes(p);
}

// 카드결제 전체 공개 스위치가 켜져 있거나, 심사용 테스트 번호로 로그인한 경우에만 카드결제 허용.
export function isCardPaymentAllowed(phone) {
  return process.env.NEXT_PUBLIC_CARD_PAYMENT_ENABLED === "true" || isCardTestPhone(phone);
}
