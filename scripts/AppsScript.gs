/**
 * 이 코드를 "예약기록"(매입현황) 구글시트의 확장 프로그램 → Apps Script 에 붙여넣고
 * 웹 앱으로 배포하세요. README.md의 "6단계 — 주문/결제(계좌이체) 연동" 참고.
 *
 * 예약기록 시트 헤더가 반드시 이 순서여야 합니다:
 * 아이디 | 주문일시 | 발송인 | 발송인 주소 | 발송인 전화번호 | 수취인 | 수취인 전화번호 | 수취인 주소 |
 * 카테고리 | 구매품목 | 수량 | 구매가격 | 배송비 | 합계금액 | 결제상태 | 발주 상태 | 택배사 | 송장번호
 *
 * 한 번의 주문에 상품이 여러 개면(장바구니 주문) 상품마다 한 줄씩 기록됩니다 —
 * 같은 주문번호(아이디)를 공유하고, 발송인/수취인/주문일시/결제상태도 동일하게 채워지되,
 * 카테고리/구매품목/수량/구매가격/배송비/합계금액은 그 상품 한 줄 기준 값입니다.
 * 발주 상태는 상품별로 따로 진행 상황을 관리할 수 있게 각 줄마다 독립적으로 수정하면 됩니다.
 *
 * 아이디 / 주문일시 / 결제상태 / 발주 상태는 이 스크립트가 자동으로 채웁니다.
 * 택배사 / 송장번호는 배송 시작할 때 시트에서 직접 입력하는 칸이라 비워둡니다.
 *
 * 발주 상태 흐름: 입금확인중 → 배송준비중 → 배송중 → 배송완료 (전부 시트에서 직접 수정)
 *
 * 참고: 주문 하나가 상품 여러 개면 그만큼 행이 늘어나므로, 다음 주문번호는
 * "주문 개수"가 아니라 "지금까지 쌓인 행 수" 기준으로 매겨집니다 (번호가 듬성듬성 늘어날 수 있음).
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const body = JSON.parse(e.postData.contents);
  const items = Array.isArray(body.items) ? body.items : [];

  const nextDataRow = sheet.getLastRow(); // 헤더가 1행이므로 마지막 데이터 행 번호 = 지금까지 쌓인 행 수
  const orderId = "ORD-" + String(nextDataRow).padStart(4, "0");
  const orderedAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  items.forEach(function (it) {
    sheet.appendRow([
      orderId,
      orderedAt,
      body.senderName || "",
      body.senderAddress || "",
      body.senderPhone || "",
      body.recipientName || "",
      body.recipientPhone || "",
      body.recipientAddress || "",
      it.category || "",
      it.item || "",
      it.qty || "",
      it.price || "",
      it.shippingFee || 0,
      it.totalAmount || "",
      "입금대기",
      "입금확인중",
      "",
      "",
    ]);
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}
