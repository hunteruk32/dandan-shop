// 손님에게 보여주는 발송 안내.
// 상품마스터 시트에 마감 열이 있으면 그 값을 우선하고, 없으면 상품 설명에서
// 발송 요일·마감 문장만 골라 쓴다. 공통 문구에 당일 발송이나 고정 시각을 넣지 않는다.
// 시트 원본은 바꾸지 않는다. 열 이름이 없으면 설명만 본다.

export const NEUTRAL_SHIPPING_CUTOFF =
  "발송 요일과 마감 시간은 상품마다 달라요. 상품 설명의 발송 안내를 확인해 주세요.";

export const ISLAND_SHIPPING_NOTICE = "제주·도서산간 지역은 배송이 불가해요.";

export const CUTOFF_COLUMN_KEYS = [
  "shipping_cutoff",
  "cutoff",
  "order_deadline",
  "발송마감",
  "마감시간",
  "배송마감",
  "배송마감시간",
];

export function readShippingCutoffCell(row) {
  if (!row) return "";
  for (const key of CUTOFF_COLUMN_KEYS) {
    const value = String(row[key] ?? "").trim();
    if (value) return value;
  }
  return "";
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");
}

function cleanLine(line) {
  return String(line || "")
    .replace(/\s+/g, " ")
    .replace(/^[\s>*\-•·]+/, "")
    .trim();
}

const DAY = "[월화수목금토일]";
// "월, 화, 목, 금" / "월·화·목·금" / "화~토"
const DAY_LIST = new RegExp(`${DAY}(?:요일)?\\s*[,·・/~～\\-]\\s*${DAY}`);

// 재고 "조기 마감"이나 산지명 "출고"처럼 발송 일정이 아닌 문장은 빼 둔다.
export function isShippingCutoffLine(line) {
  const text = cleanLine(line);
  if (!text) return false;
  const stockCloseout =
    /조기\s*마감/.test(text) && !/배송\s*마감|발송\s*마감/.test(text) && !/\d{1,2}\s*시/.test(text);
  if (stockCloseout) return false;
  if (/배송\s*마감|발송\s*마감|주문\s*마감|마감\s*시간/.test(text)) return true;
  if (/마감/.test(text) && /배송|발송|익일|당일|도착|주문/.test(text)) return true;
  if (/\d{1,2}\s*시/.test(text) && /주문|발송|배송|도착/.test(text)) return true;
  if (/배송\s*휴무|발송\s*휴무/.test(text)) return true;
  if (DAY_LIST.test(text) && /배송|발송|휴무|도착|출고/.test(text)) return true;
  if (new RegExp(`${DAY}요일`).test(text) && /배송|발송|휴무|도착/.test(text)) return true;
  return false;
}

export function extractCutoffFromDescription(description) {
  const seen = new Set();
  const kept = [];
  for (const raw of stripHtml(description).split(/\n+/)) {
    if (!isShippingCutoffLine(raw)) continue;
    const line = cleanLine(raw);
    if (!line || seen.has(line)) continue;
    seen.add(line);
    kept.push(line);
  }
  return kept.join("\n");
}

// shippingCutoff: 시트 열에서 온 값(이미 손님용으로 정리된 문자열).
// description: 손님에게 보이는 상품 설명.
export function resolveShippingCutoff({ shippingCutoff, description } = {}) {
  const fromColumn = cleanLine(shippingCutoff);
  if (fromColumn) return fromColumn;
  return extractCutoffFromDescription(description);
}
