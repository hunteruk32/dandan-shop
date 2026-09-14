import ExcelJS from "exceljs";

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
