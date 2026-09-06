/**
 * 이 코드를 "예약기록"(매입현황) 구글시트의 확장 프로그램 → Apps Script 에 붙여넣고
 * 웹 앱으로 배포하세요. README.md의 "6단계 — 주문/결제(계좌이체) 연동" 참고.
 *
 * 예약기록 시트 헤더가 반드시 이 순서여야 합니다:
 * 아이디 | 주문일시 | 발송인 | 발송인 주소 | 발송인 전화번호 | 수취인 | 수취인 전화번호 | 수취인 주소 |
 * 카테고리 | 구매품목 | 수량 | 구매가격 | 배송비 | 합계금액 | 결제상태 | 발주 상태 | 택배사 | 송장번호 | 비고 | 수정이력
 *
 * 비고는 체크아웃 화면에서 고객이 남긴 요청사항입니다. 상품이 여러 개라 줄이 여러 개로 나뉘어도
 * 같은 주문이면 모든 줄에 동일한 값이 채워집니다.
 *
 * 수정이력은 고객이 "내 주문 확인"에서 수취인 정보/비고를 직접 수정할 때마다 이 스크립트가
 * 자동으로 한 줄씩 쌓습니다(타임스탬프 + 무엇을 바꿨는지). 직접 입력할 필요 없어요.
 * 고객은 결제상태가 "입금대기"일 때만 수정할 수 있고, 발송인 정보·상품·수량·가격은 수정 대상이 아닙니다.
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
 * 주문번호 형식: ORD-yyMMdd-발송인전화번호뒷4자리-일련번호 (예: ORD-260907-8287-0001).
 * 일련번호는 주문 하나가 상품 여러 개면 그만큼 행이 늘어나므로, "주문 개수"가 아니라
 * "지금까지 쌓인 행 수" 기준으로 매겨집니다 (번호가 듬성듬성 늘어날 수 있음).
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
  const body = JSON.parse(e.postData.contents);
  if (body.action === "update") return handleUpdate(body);
  return handleCreate(body);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function handleCreate(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const items = Array.isArray(body.items) ? body.items : [];

  const nextDataRow = sheet.getLastRow(); // 헤더가 1행이므로 마지막 데이터 행 번호 = 지금까지 쌓인 행 수
  const now = new Date();
  const dateCode = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyMMdd");
  const phoneLast4 = String(body.senderPhone || "").replace(/[^0-9]/g, "").slice(-4);
  const orderId = "ORD-" + dateCode + "-" + phoneLast4 + "-" + String(nextDataRow).padStart(4, "0");
  const orderedAt = Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

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
      body.note || "",
      "",
    ]);
  });

  // 전화번호가 숫자로 자동 변환되어 앞자리 0이 사라지는 것을 방지 (텍스트로 강제)
  for (let r = nextDataRow + 1; r <= nextDataRow + items.length; r++) {
    sheet.getRange(r, 5).setNumberFormat("@").setValue(body.senderPhone || "");
    sheet.getRange(r, 7).setNumberFormat("@").setValue(body.recipientPhone || "");
  }

  updateMemberStats(body.senderPhone);

  return jsonOutput({ ok: true, orderId: orderId });
}

function handleUpdate(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const orderId = String(body.orderId || "").trim();
  const requesterPhone = String(body.requesterPhone || "").replace(/[^0-9]/g, "");

  const rowNumbers = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === orderId) rowNumbers.push(i + 1); // 1-based 시트 행 번호
  }
  if (rowNumbers.length === 0) {
    return jsonOutput({ ok: false, error: "주문을 찾을 수 없어요." });
  }

  const firstRow = data[rowNumbers[0] - 1];
  const senderPhone = String(firstRow[4] || "").replace(/[^0-9]/g, "");
  if (!requesterPhone || senderPhone !== requesterPhone) {
    return jsonOutput({ ok: false, error: "본인 주문만 수정할 수 있어요." });
  }

  const paymentStatus = String(firstRow[14] || "").trim();
  if (paymentStatus !== "입금대기") {
    return jsonOutput({ ok: false, error: "입금 확인 후에는 수정할 수 없어요. 사장님께 문의해주세요." });
  }

  const oldRecipientName = String(firstRow[5] || "").trim();
  const oldRecipientPhone = String(firstRow[6] || "").trim();
  const oldRecipientAddress = String(firstRow[7] || "").trim();
  const oldNote = String(firstRow[18] || "").trim();

  const newRecipientName = String(body.recipientName || "").trim();
  const newRecipientPhone = String(body.recipientPhone || "").trim();
  const newRecipientAddress = String(body.recipientAddress || "").trim();
  const newNote = String(body.note || "").trim();

  const changes = [];
  if (oldRecipientName !== newRecipientName) {
    changes.push("수취인 성함: " + oldRecipientName + " → " + newRecipientName);
  }
  if (oldRecipientPhone.replace(/[^0-9]/g, "") !== newRecipientPhone.replace(/[^0-9]/g, "")) {
    changes.push("수취인 전화번호: " + oldRecipientPhone + " → " + newRecipientPhone);
  }
  if (oldRecipientAddress !== newRecipientAddress) {
    changes.push("수취인 주소: " + oldRecipientAddress + " → " + newRecipientAddress);
  }
  if (oldNote !== newNote) {
    changes.push("비고: " + (oldNote || "(없음)") + " → " + (newNote || "(없음)"));
  }

  if (changes.length === 0) {
    return jsonOutput({ ok: true, changed: false });
  }

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const historyEntry = timestamp + " " + changes.join("; ");

  rowNumbers.forEach(function (r) {
    sheet.getRange(r, 6).setValue(newRecipientName);
    sheet.getRange(r, 7).setNumberFormat("@").setValue(newRecipientPhone);
    sheet.getRange(r, 8).setValue(newRecipientAddress);
    sheet.getRange(r, 19).setValue(newNote);

    const historyCell = sheet.getRange(r, 20);
    const prevHistory = String(historyCell.getValue() || "").trim();
    historyCell.setValue(prevHistory ? prevHistory + "\n" + historyEntry : historyEntry);
  });

  return jsonOutput({
    ok: true,
    changed: true,
    historyEntry: historyEntry,
    recipientName: newRecipientName,
    recipientPhone: newRecipientPhone,
    recipientAddress: newRecipientAddress,
    note: newNote,
  });
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
