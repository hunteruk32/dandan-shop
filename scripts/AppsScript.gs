/**
 * 이 코드를 "매입현황" 구글시트의 확장 프로그램 → Apps Script 에 붙여넣고
 * 웹 앱으로 배포하세요. README.md의 "6단계 — 주문/결제(계좌이체) 연동" 참고.
 *
 * 매입현황 시트 헤더가 반드시 이 순서여야 합니다 (총 21열):
 * 아이디 | 주문일시 | 발송인 | 발송인 주소 | 발송인 전화번호 | 수취인 | 수취인 전화번호 | 수취인 주소 |
 * 카테고리 | 구매품목 | 수량 | 구매가격 | 배송비 | 합계금액 | 결제상태 | 발주 상태 | 토스결제키 | 택배사 |
 * 송장번호 | 비고 | 수정이력
 *
 * `토스결제키`(17번째 열, 발주 상태 바로 다음)는 카드결제 승인 시(handleCreate) 자동으로 채워지며,
 * 고객이 카드결제 주문을 취소할 때(handleStatusRequest) 토스페이먼츠 결제취소 API를 자동으로
 * 호출하는 데 쓰입니다. 계좌이체 주문은 이 열이 비어있고, 지금처럼 수동으로 환불 처리합니다.
 *
 * 카드결제 주문은 Next.js 쪽(app/api/order, app/api/payment/confirm)에서 토스 승인이
 * 실제로 끝난 뒤에만 이 매입현황시트에 생성 요청을 보냅니다 — 결제창을 닫고 나가거나
 * 결제가 실패해도 "결제 안 한 주문"이 시트에 안 남도록 하기 위함입니다. 그래서 카드결제
 * 주문은 "카드결제대기"/"입금확인중" 단계 없이 바로 "카드결제완료"/"배송준비중"으로
 * 시작합니다.
 *
 * ── 카드결제 자동 취소 설정 (선택, 안 해도 주문 접수·수동 취소는 정상 작동) ──
 * 카드결제 주문을 고객이 "내 주문 확인"에서 취소 요청하면, 자동으로 토스페이먼츠에 결제취소를
 * 요청하고 바로 "취소완료" 처리합니다(사람이 따로 환불할 필요 없음). 이 기능을 쓰려면:
 *   1) 이 Apps Script 편집기에서 왼쪽 톱니바퀴(프로젝트 설정) 클릭
 *   2) "스크립트 속성" 항목에서 "스크립트 속성 추가"
 *   3) 속성: TOSS_SECRET_KEY / 값: 토스 개발자센터 "실제연동(라이브)" 탭의 시크릿 키
 *      (주문서형·결제창형 연동 키 섹션 — Vercel의 TOSS_SECRET_KEY와 동일한 값)
 * 등록 안 해도 주문 접수·카드결제 승인은 정상 동작하며, 취소만 기존처럼(취소중 상태로 바뀌고)
 * 사람이 직접 토스 상점관리자에서 환불 처리하면 됩니다.
 *
 * ── 즉시 반영 설정 (선택, 안 해도 최대 60초 뒤엔 알아서 반영됨) ──
 * 기본적으로 홈페이지는 60초마다 시트 내용을 다시 불러오는데, 그래서 주문 직후 "내 주문
 * 확인"에 내 주문이 바로 안 보일 수 있습니다. triggerRevalidate 참고 — 아래 두 속성을
 * 등록해두면 주문이 생성·수정될 때마다 딜레이 없이 바로 반영됩니다:
 *   1) 이 Apps Script 편집기에서 왼쪽 톱니바퀴(프로젝트 설정) 클릭
 *   2) "스크립트 속성" 항목에서 "스크립트 속성 추가"를 두 번
 *      — REVALIDATE_URL: https://내도메인/api/revalidate
 *      — REVALIDATE_SECRET: Vercel의 REVALIDATE_SECRET과 동일한 랜덤 문자열
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
 * 발주 상태는 시트에서 직접 수정합니다. 가능한 값(화면에 색으로 구분되어 표시됨):
 *   정상 흐름: 입금확인중 → 배송준비중 → 배송중 → 배송완료
 *   취소: 취소중 → 취소완료 / 반품: 반품중 → 반품완료 / 교환: 교환중 → 교환완료
 *
 * "내 주문 확인"에서 고객이 취소/반품을 요청하면(handleStatusRequest) 발주 상태가
 * 자동으로 취소중/반품중으로 바뀌고 수정이력에 "[고객] 취소 요청: 사유"가 남습니다.
 * 계좌이체 주문의 실제 환불·반품 처리는 여기서 자동으로 되지 않으니, 확인 후 계좌이체로
 * 환불해주시고 처리가 끝나면 발주 상태를 취소완료/반품완료로 직접 바꿔주세요.
 * 카드결제 주문의 취소는(TOSS_SECRET_KEY 설정 시) 토스페이먼츠 결제취소까지 자동으로 되고
 * 발주 상태도 바로 취소완료로 끝납니다 — 반품은 상품 회수 확인이 먼저 필요해서 자동화하지
 * 않았으니 기존처럼 직접 처리해주세요.
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
  if (body.action === "statusRequest") return handleStatusRequest(body);
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

  // 카드결제는 Next.js 쪽에서 토스 승인이 이미 끝난 뒤에만 이 함수를 호출하므로
  // (결제창 이탈 시 빈 주문이 안 남게, 주문 생성 자체를 승인 이후로 미뤘다 — 자세한 내용은
  // app/api/order/route.js, app/api/payment/confirm/route.js 참고), paymentKey가 같이
  // 오면 바로 "카드결제완료"/"배송준비중"으로 시작하고 토스결제키도 같이 저장한다.
  const paymentKey = String(body.paymentKey || "").trim();
  const isConfirmedCard = body.paymentMethod === "card" && paymentKey;
  const paymentStatus = isConfirmedCard ? "카드결제완료" : "입금대기";
  const orderStatus = isConfirmedCard ? "배송준비중" : "입금확인중";
  const historyEntry = isConfirmedCard
    ? orderedAt + " [토스페이먼츠] 카드결제 승인 완료 (paymentKey: " + paymentKey + ")"
    : "";

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
      paymentStatus,
      orderStatus,
      paymentKey,
      "",
      "",
      body.note || "",
      historyEntry,
    ]);
  });

  // 전화번호가 숫자로 자동 변환되어 앞자리 0이 사라지는 것을 방지 (텍스트로 강제)
  for (let r = nextDataRow + 1; r <= nextDataRow + items.length; r++) {
    sheet.getRange(r, 5).setNumberFormat("@").setValue(body.senderPhone || "");
    sheet.getRange(r, 7).setNumberFormat("@").setValue(body.recipientPhone || "");
  }

  updateMemberStats(body.senderPhone);
  triggerRevalidate("orders");

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
  const oldNote = String(firstRow[19] || "").trim();

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
    sheet.getRange(r, 20).setValue(newNote);

    const historyCell = sheet.getRange(r, 21);
    const prevHistory = String(historyCell.getValue() || "").trim();
    historyCell.setValue(prevHistory ? prevHistory + "\n" + historyEntry : historyEntry);
  });

  triggerRevalidate("orders");

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

/**
 * 고객이 "내 주문 확인"에서 취소/반품을 요청할 때 호출됨 (action: "statusRequest").
 * body: { orderId, requesterPhone, itemIndex, type: "cancel" | "return", reason }
 *
 * itemIndex는 이 주문(orderId)에 속한 행들 중 몇 번째 상품인지(0부터 시작, 시트에 쌓인
 * 순서 그대로) — Next.js 쪽에서 order.items 배열의 인덱스를 그대로 보내준다.
 *
 * 취소 요청은 발주 상태가 "입금확인중"/"배송준비중"일 때만(아직 배송 시작 전) 가능하고,
 * 반품 요청은 "배송완료"일 때만 가능하다. 카드결제 취소는 토스페이먼츠 결제취소 API를
 * 바로 호출해서 성공하면 "취소완료"까지 끝낸다(cancelTossPayment 참고). 계좌이체 취소와
 * 반품은(자동 환불 수단이 없으므로) 기존처럼 "취소중"/"반품중"으로만 바꾸고, 수정이력에
 * 남긴 뒤 사장님이 직접 환불·반송 수거를 진행하고 완료되면 "취소완료"/"반품완료"로
 * 마무리하면 된다.
 */
function handleStatusRequest(body) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const data = sheet.getDataRange().getValues();
  const orderId = String(body.orderId || "").trim();
  const requesterPhone = String(body.requesterPhone || "").replace(/[^0-9]/g, "");
  const itemIndex = Number(body.itemIndex);
  const type = body.type;
  const reason = String(body.reason || "").trim();

  const rowNumbers = [];
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === orderId) rowNumbers.push(i + 1);
  }
  if (rowNumbers.length === 0) {
    return jsonOutput({ ok: false, error: "주문을 찾을 수 없어요." });
  }

  const firstRow = data[rowNumbers[0] - 1];
  const senderPhone = String(firstRow[4] || "").replace(/[^0-9]/g, "");
  if (!requesterPhone || senderPhone !== requesterPhone) {
    return jsonOutput({ ok: false, error: "본인 주문만 요청할 수 있어요." });
  }

  const targetRowNum = rowNumbers[itemIndex];
  if (!targetRowNum) {
    return jsonOutput({ ok: false, error: "상품을 찾을 수 없어요." });
  }

  const currentStatus = String(sheet.getRange(targetRowNum, 16).getValue()).trim();
  let newStatus;
  if (type === "cancel") {
    if (["입금확인중", "배송준비중"].indexOf(currentStatus) === -1) {
      return jsonOutput({ ok: false, error: "이미 배송이 시작되어 취소할 수 없어요. 반품 요청을 이용해주세요." });
    }
    newStatus = "취소중";
  } else if (type === "return") {
    if (currentStatus !== "배송완료") {
      return jsonOutput({ ok: false, error: "배송완료된 상품만 반품 요청할 수 있어요." });
    }
    newStatus = "반품중";
  } else {
    return jsonOutput({ ok: false, error: "잘못된 요청이에요." });
  }

  const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const label = type === "cancel" ? "취소 요청" : "반품 요청";
  let historyEntry = timestamp + " [고객] " + label + (reason ? ": " + reason : "");

  // 카드결제 취소 요청이면 토스페이먼츠에 바로 결제취소를 요청한다(반품은 상품 회수 확인이
  // 먼저 필요하므로 자동화하지 않고 기존처럼 사람이 처리한다).
  const paymentStatus = String(sheet.getRange(targetRowNum, 15).getValue()).trim();
  if (type === "cancel" && paymentStatus === "카드결제완료") {
    const row = data[targetRowNum - 1];
    const paymentKey = String(row[16] || "").trim();
    const rowAmount = Number(row[13]) || 0; // 합계금액 — 이 줄(상품) 몫만큼만 부분 취소

    const cancelResult = cancelTossPayment(paymentKey, reason || "고객 요청", rowAmount);
    if (cancelResult.ok) {
      newStatus = "취소완료";
      sheet.getRange(targetRowNum, 15).setValue("카드결제취소완료");
      historyEntry += "\n" + timestamp + " [토스페이먼츠] 카드결제 자동 취소완료 (" + rowAmount + "원)";
    } else {
      historyEntry += "\n" + timestamp + " [토스페이먼츠] 자동 취소 실패: " + cancelResult.error + " — 수동으로 확인해주세요.";
    }
  }

  sheet.getRange(targetRowNum, 16).setValue(newStatus);

  const historyCell = sheet.getRange(targetRowNum, 21);
  const prevHistory = String(historyCell.getValue() || "").trim();
  historyCell.setValue(prevHistory ? prevHistory + "\n" + historyEntry : historyEntry);

  triggerRevalidate("orders");

  return jsonOutput({ ok: true, newStatus: newStatus });
}

/**
 * 토스페이먼츠 결제취소 API 호출. paymentKey가 없거나 TOSS_SECRET_KEY 속성이 설정 안 돼
 * 있으면 호출하지 않고 바로 실패로 반환한다(기존처럼 수동 처리하라는 뜻).
 * cancelAmount를 생략하면 전액 취소, 지정하면 그 금액만큼만 부분 취소한다.
 */
function cancelTossPayment(paymentKey, reason, cancelAmount) {
  if (!paymentKey) {
    return { ok: false, error: "이 주문에 저장된 결제키가 없어요" };
  }
  const secretKey = PropertiesService.getScriptProperties().getProperty("TOSS_SECRET_KEY");
  if (!secretKey) {
    return { ok: false, error: "TOSS_SECRET_KEY 스크립트 속성이 설정 안 돼 있어요" };
  }

  const payload = { cancelReason: reason || "고객 요청" };
  if (cancelAmount) payload.cancelAmount = cancelAmount;

  try {
    const res = UrlFetchApp.fetch("https://api.tosspayments.com/v1/payments/" + paymentKey + "/cancel", {
      method: "post",
      contentType: "application/json",
      headers: { Authorization: "Basic " + Utilities.base64Encode(secretKey + ":") },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    if (code >= 200 && code < 300) return { ok: true };
    const body = JSON.parse(res.getContentText());
    // 이미 취소된 결제(ALREADY_CANCELED_PAYMENT)는 토스 쪽엔 취소가 반영됐는데 우리 시트만
    // 그걸 놓친 경우(예: 이전 시도가 권한 문제로 응답을 못 받았지만 실제로는 처리됐던 경우)다.
    // 원하는 최종 상태(취소됨)는 이미 맞으므로 실패가 아니라 성공으로 취급한다.
    if (body.code === "ALREADY_CANCELED_PAYMENT") return { ok: true };
    return { ok: false, error: body.message || ("토스 API 응답 " + code) };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

/**
 * 주문이 생성·수정될 때마다 호출해서, 60초 캐시를 기다리지 않고 홈페이지의
 * "내 주문 확인"이 바로 최신 상태로 보이게 한다(REVALIDATE_URL/REVALIDATE_SECRET
 * 스크립트 속성 설정 시에만 동작 — 선택 기능, 안 해도 기존처럼 최대 60초 뒤에 반영됨).
 * 설정하려면:
 *   1) 이 Apps Script 편집기에서 왼쪽 톱니바퀴(프로젝트 설정) 클릭
 *   2) "스크립트 속성" 항목에서 "스크립트 속성 추가"를 두 번 — REVALIDATE_URL(예:
 *      https://dandan-shop.co.kr/api/revalidate), REVALIDATE_SECRET(Vercel의
 *      REVALIDATE_SECRET과 동일한 값, 아무 랜덤 문자열로 만들면 됨)
 */
function triggerRevalidate(tag) {
  const url = PropertiesService.getScriptProperties().getProperty("REVALIDATE_URL");
  const secret = PropertiesService.getScriptProperties().getProperty("REVALIDATE_SECRET");
  if (!url || !secret) return;
  try {
    UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ tag: tag, secret: secret }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    // 실패해도 주문 자체엔 영향 없음 — 기존처럼 최대 60초 뒤 캐시로 반영됨
  }
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
