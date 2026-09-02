/**
 * 이 코드를 "예약기록" 구글시트의 확장 프로그램 → Apps Script 에 붙여넣고
 * 웹 앱으로 배포하세요. README.md의 "6단계 — 주문/결제(계좌이체) 연동" 참고.
 *
 * 예약기록 시트 헤더가 반드시 이 순서여야 합니다:
 * 아이디 | 주문일시 | 발송인 | 발송인 주소 | 발송인 전화번호 | 수취인 | 수취인 전화번호 | 수취인 주소 |
 * 카테고리 | 구매품목 | 수량 | 구매가격 | 배송비 | 합계금액 | 결제상태 | 발주 상태
 *
 * 아이디 / 주문일시 / 결제상태 / 발주 상태는 이 스크립트가 자동으로 채웁니다.
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const body = JSON.parse(e.postData.contents);

  const nextDataRow = sheet.getLastRow(); // 헤더가 1행이므로 마지막 데이터 행 번호 = 지금까지 주문 수
  const orderId = "ORD-" + String(nextDataRow).padStart(4, "0");
  const orderedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([
    orderId,
    orderedAt,
    body.senderName || "",
    body.senderAddress || "",
    body.senderPhone || "",
    body.recipientName || "",
    body.recipientPhone || "",
    body.recipientAddress || "",
    body.category || "",
    body.item || "",
    body.qty || "",
    body.price || "",
    body.shippingFee || 0,
    body.totalAmount || "",
    "입금대기",
    "발주대기",
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}
