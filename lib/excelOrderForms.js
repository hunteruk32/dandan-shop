import ExcelJS from "exceljs";
import { baseItemName } from "./sheet";

// 매입처가 실제 쓰는 발주 양식 그대로 헤더를 맞춰서 엑셀을 생성한다.
// 각 항목(items)은 lib/purchaseOrders.js의 getPendingPurchaseOrders()가 반환하는 형태를 따른다.

function todayKr() {
  const d = new Date(Date.now() + 9 * 60 * 60 * 1000); // KST
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

async function buildWorkbook(sheetName, headers, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };
  for (const row of rows) ws.addRow(row);
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 40);
  });
  return wb.xlsx.writeBuffer();
}

function daonRows(items) {
  return items.map((it) => [
    it.senderName,
    it.senderPhone,
    it.itemName,
    it.recipientName,
    it.recipientAddress,
    it.recipientPhone,
    it.note || "",
  ]);
}

function woolimKimchiRows(items) {
  return items.map((it) => [
    it.senderName,
    it.senderPhone,
    "", "", "",
    it.senderAddress,
    it.recipientName,
    it.recipientPhone,
    "", "", "",
    it.recipientAddress,
    it.qty,
    it.itemName,
    "", "", "",
    it.note || "",
  ]);
}

function woolimCitrusRows(items) {
  return items.map((it) => [
    it.recipientName,
    "",
    it.recipientPhone,
    it.recipientAddress,
    it.note || "",
    it.qty,
    "",
    it.itemName,
    it.senderName,
    it.senderAddress,
    it.senderPhone,
    "",
    "더블에스글로벌",
    "",
  ]);
}

// 발송인 정보 없이 수취인 정보만 받는 양식 (업체 자체 발송 처리).
function rgmCompanyRows(items) {
  return items.map((it) => [
    it.recipientName,
    it.recipientPhone,
    "",
    it.recipientAddress,
    it.itemName,
    it.qty,
    "",
    it.note || "",
  ]);
}

// 망고컴퍼니 B2B몰 대량주문 업로드 양식.
function mangoRows(items) {
  const orderDate = todayKr();
  return items.map((it) => [
    it.senderName,
    it.senderPhone,
    it.itemName,
    it.qty,
    it.recipientName,
    it.recipientPhone,
    it.recipientAddress,
    "",
    it.note || "",
    orderDate,
    "",
    "",
  ]);
}

// 김장 예약 같은 상품은 옵션명 자체가 "11월 20일 금요일 도착" 같은 도착희망일이다(사장님 확인).
// baseItemName과 같은 방식으로 상품명에서 마지막 괄호 옵션만 떼어낸 뒤, 그 옵션이 날짜
// 형식("O월 O일")이면 도착희망일로 보고 품목명에서는 빼서 특이사항으로 옮긴다.
// 옵션이 없거나 날짜 형식이 아닌 일반 상품(예: 단순 무게 옵션)은 잘못 판단해서 엉뚱한 값을
// 도착희망일로 써넣는 것보다, 표시만 남기고 사람이 직접 채우게 한다.
const ARRIVAL_DATE_OPTION_RE = /\d{1,2}\s*월\s*\d{1,2}\s*일/;

function splitItemOption(itemNameWithOption) {
  const base = baseItemName(itemNameWithOption);
  if (base === itemNameWithOption) return { base: itemNameWithOption, option: "" };
  let option = itemNameWithOption.slice(base.length).trim();
  if (option.startsWith("(") && option.endsWith(")")) option = option.slice(1, -1).trim();
  return { base, option };
}

// 운임Type(박스 크기별 코드로 보임)은 상품마다 달라 자동화 기준이 불명확해 비워둔다 —
// 자동화하려면 사장님께 코드 기준을 확인해야 한다.
function freshDreamRows(items) {
  return items.map((it) => {
    const { base, option } = splitItemOption(it.itemName);
    const isArrivalDate = ARRIVAL_DATE_OPTION_RE.test(option);
    const productNameCell = isArrivalDate ? base : it.itemName;
    const specialNote = isArrivalDate
      ? [it.note, option].filter(Boolean).join(" / ")
      : [it.note, "⚠️도착희망일 입력 필요"].filter(Boolean).join(" / ");

    return [
      it.senderName,
      it.senderPhone,
      "", "", "",
      it.senderAddress,
      it.recipientName,
      it.recipientPhone,
      "", "", "",
      it.recipientAddress,
      it.qty,
      productNameCell,
      "",
      "신용",
      "",
      specialNote,
    ];
  });
}

function woolimJeotgalRows(items) {
  const orderDate = todayKr();
  return items.map((it) => [
    orderDate,
    it.orderId,
    it.itemName,
    it.qty,
    it.recipientName,
    "",
    it.recipientAddress,
    it.recipientPhone,
    "",
    it.senderName,
    it.senderPhone,
    "",
    it.note || "",
    "", "", "",
    it.productId || "",
    "",
  ]);
}

const TEMPLATES = {
  "망고컴퍼니": {
    fileLabel: "망고컴퍼니",
    sheetName: "sheet1",
    headers: [
      "상호명", "상호 연락처", "주문상품명(옵션포함)", "수량", "수령인", "수령인 휴대전화",
      "수령인 주소", "수령인 우편번호", "배송메세지", "발주일", "택배사", "운송장번호",
    ],
    rows: mangoRows,
  },
  "다온": {
    fileLabel: "다온",
    sheetName: "Sheet1",
    headers: ["송하인", "송하인 연락처", "품목명", "수령인", "주소(도로명주소)", "연락처", "배송메세지"],
    rows: daonRows,
  },
  "운림(김치)": {
    fileLabel: "운림_김치",
    sheetName: "sheet1",
    headers: [
      "보내시는 분", "보내시는 분 전화", "보내는분담당자", "보내는분담당자HP", "보내는분우편번호", "보내는분총주소",
      "받으시는 분", "받으시는 분 전화", "받는분담당자", "받는분핸드폰", "받는분우편번호", "받는분총주소",
      "수량", "품목명", "운임Type", "지불조건", "업체명", "배송메모",
    ],
    rows: woolimKimchiRows,
  },
  // 운림(김치)와 동일한 양식을 쓰지만, 별도 매입처로 발주서가 따로 묶여서 나가야 하므로
  // TEMPLATES에 독립된 항목으로 둔다(발주 로그·엑셀 파일명도 매입처별로 분리됨).
  "두배수산": {
    fileLabel: "두배수산",
    sheetName: "sheet1",
    headers: [
      "보내시는 분", "보내시는 분 전화", "보내는분담당자", "보내는분담당자HP", "보내는분우편번호", "보내는분총주소",
      "받으시는 분", "받으시는 분 전화", "받는분담당자", "받는분핸드폰", "받는분우편번호", "받는분총주소",
      "수량", "품목명", "운임Type", "지불조건", "업체명", "배송메모",
    ],
    rows: woolimKimchiRows,
  },
  "이레수산": {
    fileLabel: "이레수산",
    sheetName: "sheet1",
    headers: [
      "보내시는 분", "보내시는 분 전화", "보내는분담당자", "보내는분담당자HP", "보내는분우편번호", "보내는분총주소",
      "받으시는 분", "받으시는 분 전화", "받는분담당자", "받는분핸드폰", "받는분우편번호", "받는분총주소",
      "수량", "품목명", "운임Type", "지불조건", "업체명", "배송메모",
    ],
    rows: woolimKimchiRows,
  },
  "신선드림": {
    fileLabel: "신선드림",
    sheetName: "sheet1",
    headers: [
      "보내시는 분", "보내시는 분 전화", "보내는분담당자", "보내는분담당자HP", "보내는분우편번호", "보내는분총주소",
      "받으시는 분", "받으시는 분 전화", "받는분담당자", "받는분핸드폰", "받는분우편번호", "받는분총주소",
      "수량", "품목명", "운임Type", "지불조건", "", "특이사항",
    ],
    rows: freshDreamRows,
  },
  "알지엠컴파니": {
    fileLabel: "알지엠컴파니",
    sheetName: "sheet1",
    headers: [
      "받는분성명", "받는분전화번호", "받는분기타연락처", "받는분주소(전체, 분할)",
      "품목명", "박스수량", "박스타입", "배송메세지1",
    ],
    rows: rgmCompanyRows,
  },
  "운림(감귤)": {
    fileLabel: "운림_감귤",
    sheetName: "Sheet1",
    headers: [
      "받는고객", "받는고객전화번호", "받는고객핸드폰번호", "받는고객전체주소", "비고", "박스수량", "운임", "품명",
      "보내는고객", "보내는고객전체주소", "보내는고객전화번호", "배송메시지", "비고", "송장번호 (로젠택배)",
    ],
    rows: woolimCitrusRows,
  },
  "운림(젓갈)": {
    fileLabel: "운림_젓갈",
    sheetName: "주문서",
    headers: [
      "발주일", "주문번호", "상품명", "EA(확정)", "수취인", "수취인우편번호", "수취인주소", "수취인전화번호1", "수취인전화번호2",
      "보내는분", "보내는분전화번호1", "보내는분전화번호2", "배송메모", "기타메세지", "송장번호", "택배사", "자체상품코드", "사방넷주문번호",
    ],
    rows: woolimJeotgalRows,
  },
};

export function isSupportedSupplier(supplier) {
  return Object.prototype.hasOwnProperty.call(TEMPLATES, supplier);
}

export async function generateSupplierOrderExcel(supplier, items) {
  const tpl = TEMPLATES[supplier];
  if (!tpl) throw new Error(`지원하지 않는 매입처 양식: ${supplier}`);
  const rows = tpl.rows(items);
  const buffer = await buildWorkbook(tpl.sheetName, tpl.headers, rows);
  const fileName = `${tpl.fileLabel}_발주서_${todayKr().replace(/\./g, "")}.xlsx`;
  return { buffer, fileName };
}
