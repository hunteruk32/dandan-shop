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
 *
 * ── 회원 시트 연동 (연간/당월 주문 통계 자동 갱신) ──
 * 주문이 들어올 때마다 "회원" 시트에서 발송인 전화번호가 일치하는 행을 찾아
 * 연간주문횟수 / 연간주문금액 / 당월주문량 / 당월주문금액(D~G열)을 이 시트의 데이터로
 * 다시 계산해서 덮어씁니다. 이 기능을 쓰려면 딱 한 번, 아래처럼 회원 시트의 ID를
 * 스크립트 속성에 등록해주세요:
 *   1) 이 Apps Script 편집기에서 왼쪽 톱니바퀴(프로젝트 설정) 클릭
 *   2) "스크립트 속성" 항목에서 "스크립트 속성 추가"
 *   3) 속성: MEMBER_SHEET_ID / 값: 회원 구글시트 URL의 .../d/와 /edit 사이 긴 문자열
 * 등록 안 해도 주문 접수 자체는 정상 동작하며, 회원 통계 갱신만 건너뜁니다.
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

  updateMemberStats(body.senderPhone);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, orderId }))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateMemberStats(phone) {
  const memberSheetId = PropertiesService.getScriptProperties().getProperty("MEMBER_SHEET_ID");
  const normalizedPhone = String(phone || "").replace(/[^0-9]/g, "");
  if (!memberSheetId || !normalizedPhone) return;

  const memberSheet = SpreadsheetApp.openById(memberSheetId).getSheets()[0];
  const memberData = memberSheet.getDataRange().getValues();

  let memberRow = -1;
  for (let i = 1; i < memberData.length; i++) {
    if (String(memberData[i][0]).replace(/[^0-9]/g, "") === normalizedPhone) {
      memberRow = i + 1; // 시트 행 번호(1-based)
      break;
    }
  }
  if (memberRow === -1) return; // 회원이 아니면 통계 갱신 안 함

  const orderSheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const orderData = orderSheet.getDataRange().getValues();
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth();

  const yearOrderIds = {};
  const monthOrderIds = {};
  let yearAmount = 0;
  let monthAmount = 0;

  for (let i = 1; i < orderData.length; i++) {
    const row = orderData[i];
    const rowPhone = String(row[4] || "").replace(/[^0-9]/g, ""); // 발송인 전화번호
    if (rowPhone !== normalizedPhone) continue;

    const orderedAt = new Date(row[1]); // 주문일시
    if (isNaN(orderedAt) || orderedAt.getFullYear() !== curYear) continue;

    const orderId = row[0];
    const amount = Number(row[13]) || 0; // 합계금액

    yearOrderIds[orderId] = true;
    yearAmount += amount;

    if (orderedAt.getMonth() === curMonth) {
      monthOrderIds[orderId] = true;
      monthAmount += amount;
    }
  }

  memberSheet.getRange(memberRow, 4, 1, 4).setValues([[
    Object.keys(yearOrderIds).length,
    yearAmount,
    Object.keys(monthOrderIds).length,
    monthAmount,
  ]]);
}
