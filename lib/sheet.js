import Papa from "papaparse";
import { selectPublicProducts } from "./publicProduct";

// tag를 붙여두면 /api/revalidate로 그 태그만 즉시 다시 불러오게 할 수 있다
// (매입현황시트가 주문을 쓸 때마다 Apps Script가 호출 — scripts/AppsScript.gs 참고).
// 평소엔 60초마다 알아서 새로고침되고, 호출이 실패해도 그 60초 주기로 늦게라도 반영된다.
async function fetchCsv(url, tag) {
  const res = await fetch(url, { next: { revalidate: 60, tags: tag ? [tag] : [] } });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

const MAX_OPTIONS = 40;

// 주문 시트의 "구매품목"은 "상품명 (옵션명) x수량" 형태로 저장된다(app/api/order/route.js 참고).
// 옵션명 자체에 괄호가 들어있는 상품(예: "4kg(16과내외)")이 있으면 "마지막 닫는 괄호 앞까지가
// 옵션"이라고 가정하는 정규식(중첩 괄호 미지원)이 깨져서 상품명을 못 찾는 문제가 있었다.
// 그렇다고 "마지막 ' ('"를 기준으로 잘라도, 옵션명 안에 공백+괄호가 또 있는 경우
// (예: "전어 세꼬시 300g (14-16미)")는 그 안쪽 괄호에서 잘못 잘린다.
// 맨 끝 ")"부터 괄호 짝을 맞춰 거꾸로 훑어서 그 ")"와 실제로 짝이 맞는 "("를 찾는 편이
// 중첩 정도와 공백 유무에 관계없이 안전하다.
export function baseItemName(item) {
  const withoutQty = String(item || "").replace(/\s*x\d+$/i, "").trim();
  if (!withoutQty.endsWith(")")) return withoutQty;

  let depth = 0;
  for (let i = withoutQty.length - 1; i >= 0; i--) {
    const ch = withoutQty[i];
    if (ch === ")") depth++;
    else if (ch === "(") {
      depth--;
      if (depth === 0) {
        return i > 0 && withoutQty[i - 1] === " " ? withoutQty.slice(0, i - 1).trim() : withoutQty;
      }
    }
  }
  return withoutQty;
}

// 옵션명에 "250g", "1.5kg" 같은 무게 표기가 있으면 그램 단위로 추출한다.
// (젓갈류 합배송비 계산에 쓰임 — lib/shipping.js)
function parseWeightG(name) {
  const match = name.match(/(\d+(?:\.\d+)?)\s*(kg|g)(?![a-zA-Z])/i);
  if (!match) return 0;
  const value = Number(match[1]);
  return match[2].toLowerCase() === "kg" ? value * 1000 : value;
}

function parseOptions(r) {
  const options = [];
  for (let i = 1; i <= MAX_OPTIONS; i++) {
    const name = String(r[`option${i}`] || "").trim();
    const price = Number(String(r[`price${i}`] || "0").replace(/[^0-9]/g, "")) || 0;
    const listPrice = Number(String(r[`list_price${i}`] || "0").replace(/[^0-9]/g, "")) || 0;
    if (name && price) options.push({ name, price, listPrice, weightG: parseWeightG(name) });
  }
  return options;
}

// 시트 원본. 매입처(supplier)와 정리 전 description이 들어 있다.
// 발주·관리자처럼 서버 안에서만 끝나는 코드만 쓴다. 클라이언트 props나 응답 JSON으로 넘기면 안 된다.
async function loadAllProducts() {
  const rows = await fetchCsv(process.env.PRODUCTS_CSV_URL, "products");
  return rows
    .filter((r) => r.id && r.name)
    .map((r) => {
      const options = parseOptions(r);
      const price = options.length ? Math.min(...options.map((o) => o.price)) : 0;
      const minPriceOption = options.find((o) => o.price === price);
      return {
        id: String(r.id).trim(),
        date: String(r.date || "").trim(),
        category: String(r.category || "기타").trim(),
        name: String(r.name).trim(),
        options,
        price,
        // 대표 정가 — 그리드 카드·상세페이지 상단처럼 옵션 하나로 요약해서 보여줘야 할 때 쓰는
        // 값이라, "대표 판매가(price)"와 짝이 맞는 최저가 옵션의 정가를 그대로 쓴다.
        // 옵션별로 다른 정가/할인율을 보여줄 땐 options[].listPrice를 직접 쓰면 된다.
        listPrice: minPriceOption ? minPriceOption.listPrice : 0,
        shippingFee: Number(String(r["shiping fee"] || "0").replace(/[^0-9]/g, "")) || 0,
        // 택배비가 별도인 상품 중, 한 박스에 합배송 가능한 최대 수량. 이 값을 넘는 수량을
        // 주문하면 (수량 / 이 값) 올림한 박스 수만큼 배송비가 추가된다. 비워두면(0) 기존처럼
        // 수량과 무관하게 한 번만 부과한다 — lib/shipping.js 참고.
        combinedShippingQty: Number(String(r.combined_shipping_qty || "0").replace(/[^0-9]/g, "")) || 0,
        status: String(r.status || "주문가능").trim(),
        image: String(r.image || "").trim(),
        description: String(r.description || "").trim(),
        detailImage: String(r.detail_image || "").trim(),
        mdPick: /^(y|yes|1|true|o)$/i.test(String(r.md_pick || "").trim()),
        supplier: String(r["매입처"] || "").trim(),
      };
    });
}

export async function getInternalProducts() {
  return loadAllProducts();
}

// 매입처별 발주 자동화에서 쓰는 값 — 상품마스터 시트 "매입처" 열에 이 중 하나를 정확히 적어야
// 자동 매칭된다. 운림은 상품 카테고리에 따라 발주 양식이 3가지로 나뉘어 있어 값을 세분화했다.
// 손님 description에 이 이름이 들어 있으면 그 줄은 지운다.
export const SUPPLIERS = ["망고컴퍼니", "다온", "운림(김치)", "운림(감귤)", "운림(젓갈)", "두배수산", "이레수산", "알지엠컴파니", "신선드림"];

// 손님용 목록. 매입처 필드는 없고, description의 내부 메모·매입처명은 지워져 있다.
// 등록대기 상품은 포함하지 않는다. 홈·상세·사이트맵·주문 가능 여부 확인은 이 함수를 쓴다.
export async function getProducts() {
  const products = await loadAllProducts();
  return selectPublicProducts(products, SUPPLIERS);
}

export async function getProductById(id) {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

// 이 전화번호로 이전에 주문한 적이 있으면, 가장 최근 주문의 발송인 성함·주소를 돌려준다.
// 체크아웃에서 매번 다시 입력하지 않도록 자동으로 채워주는 용도.
export async function getLastSenderInfo(phone) {
  const normalized = String(phone || "").replace(/[^0-9]/g, "");
  if (!normalized) return null;
  const orders = await getOrders();
  const mine = orders.filter((o) => o.senderPhone.replace(/[^0-9]/g, "") === normalized);
  if (mine.length === 0) return null;
  mine.sort((a, b) => new Date(b.orderedAt) - new Date(a.orderedAt));
  const latest = mine[0];
  return { senderName: latest.senderName, senderAddress: latest.senderAddress };
}

export async function getOrders() {
  const rows = await fetchCsv(process.env.RESERVATIONS_CSV_URL, "orders");
  return rows
    .filter((r) => r["아이디"])
    .map((r) => ({
      id: String(r["아이디"] || "").trim(),
      orderedAt: String(r["주문일시"] || "").trim(),
      senderName: String(r["발송인"] || "").trim(),
      senderAddress: String(r["발송인 주소"] || "").trim(),
      senderPhone: String(r["발송인 전화번호"] || "").trim(),
      recipientName: String(r["수취인"] || "").trim(),
      recipientPhone: String(r["수취인 전화번호"] || "").trim(),
      recipientAddress: String(r["수취인 주소"] || "").trim(),
      category: String(r["카테고리"] || "").trim(),
      item: String(r["구매품목"] || "").trim(),
      qty: Number(r["수량"] || 0) || 0,
      price: Number(String(r["구매가격"] || "0").replace(/[^0-9]/g, "")) || 0,
      shippingFee: Number(String(r["배송비"] || "0").replace(/[^0-9]/g, "")) || 0,
      totalAmount: Number(String(r["합계금액"] || "0").replace(/[^0-9]/g, "")) || 0,
      paymentStatus: String(r["결제상태"] || "").trim(),
      orderStatus: String(r["발주 상태"] || "").trim(),
      deliveredAt: String(r["배송완료일시"] || "").trim(),
      courier: String(r["택배사"] || "").trim(),
      trackingNumber: String(r["송장번호"] || "").trim(),
      note: String(r["비고"] || "").trim(),
      history: String(r["수정이력"] || "").trim(),
    }));
}

const DELIVERED_COUNT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3일

// 텔레그램 주문 알림에 같이 보여주는 현재 배송 현황 건수. "구매확정"은 고객이 수령 확인을
// 끝낸 상태라 더 이상 챙길 필요가 없으니, 배송완료 건수에서 제외된다(별도 상태값이라
// 자연히 카운트에 안 잡힌다). 배송완료 상태로 3일이 지난 건도 — 자동 구매확정
// 트리거(autoConfirmPurchases)를 아직 안 걸어뒀거나 그날 실행 전이라 상태가 그대로
// "배송완료"에 남아있을 수 있으니 — 여기서도 한 번 더 걸러서 뺀다.
export async function getOrderStatusCounts() {
  const orders = await getOrders();
  const counts = { 배송준비중: 0, 배송중: 0, 배송완료: 0 };
  const now = Date.now();
  for (const o of orders) {
    if (!(o.orderStatus in counts)) continue;
    if (o.orderStatus === "배송완료" && o.deliveredAt) {
      const deliveredAt = new Date(o.deliveredAt.replace(" ", "T")).getTime();
      if (!Number.isNaN(deliveredAt) && now - deliveredAt >= DELIVERED_COUNT_WINDOW_MS) continue;
    }
    counts[o.orderStatus] += 1;
  }
  return counts;
}

// 상품별 누적 판매수량("판매량 많은순" 정렬용). 주문 목록 자체(이름·전화번호·주소 등)는
// 절대 그대로 내보내지 않고, 상품명 기준 합계 수치만 반환한다.
export async function getProductSalesCounts() {
  const orders = await getOrders();
  const counts = {};
  for (const o of orders) {
    const name = baseItemName(o.item);
    if (!name) continue;
    counts[name] = (counts[name] || 0) + (o.qty || 0);
  }
  return counts;
}

export {
  CATEGORIES,
  STATUS_STYLE,
  ORDER_STATUS_STYLE,
  ORDER_STATUS_DEFAULT_STYLE,
} from "./catalog";
