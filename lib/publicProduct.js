// 손님 화면(HTML, RSC payload, 메타데이터)에 나가기 전에 상품을 거르는 순수 함수.
// 시트 원본과 발주용 데이터는 lib/sheet.js의 getInternalProducts()에만 둔다.

const INTERNAL_NOTE_RE = /공급가|내부메모/;
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
const BLOCK_NAMES =
  "p|div|li|tr|td|th|h[1-6]|blockquote|section|article|pre|ul|ol|table|figure|figcaption";
const INNERMOST_BLOCK_RE = new RegExp(
  `<(${BLOCK_NAMES})\\b[^>]*>(?:(?!<\\/(?:${BLOCK_NAMES})\\b)[\\s\\S])*?<\\/\\1>`,
  "gi"
);

const HIDDEN_FROM_CUSTOMERS = new Set(["등록대기"]);

function codePointToChar(code, fallback) {
  if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return fallback;
  try {
    return String.fromCodePoint(code);
  } catch {
    return fallback;
  }
}

function decodeBasicEntities(value) {
  return String(value || "")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#x([0-9a-f]+);/gi, (all, hex) => codePointToChar(parseInt(hex, 16), all))
    .replace(/&#(\d+);/g, (all, dec) => codePointToChar(Number(dec), all));
}

function normalize(value) {
  return String(value || "").replace(ZERO_WIDTH_RE, "");
}

function visibleText(html) {
  return decodeBasicEntities(normalize(html))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasInternalNote(fragment, needles) {
  const raw = normalize(fragment);
  if (INTERNAL_NOTE_RE.test(raw)) return true;
  if (needles.some((needle) => raw.includes(needle))) return true;
  const visible = visibleText(raw);
  if (!visible) return false;
  if (INTERNAL_NOTE_RE.test(visible)) return true;
  return needles.some((needle) => visible.includes(needle));
}

function filterInternalLines(text, needles) {
  const source = String(text || "");
  const lines = source.split("\n");
  const kept = lines.filter((line) => !hasInternalNote(line, needles));
  if (kept.length === lines.length) return source;
  return kept.join("\n").replace(/\n{3,}/g, "\n\n");
}

// 공급가·내부메모가 들어간 줄, <br>로 나뉜 줄, <p>/<div> 같은 블록을 뺀다.
// extraNeedles는 매입처명처럼 손님 문구에 있으면 안 되는 문자열.
export function sanitizePublicDescription(description, extraNeedles = []) {
  const needles = (Array.isArray(extraNeedles) ? extraNeedles : [])
    .map((needle) => String(needle || "").trim())
    .filter(Boolean);

  let text = String(description || "");
  if (!text.trim()) return "";

  text = text.replace(/<!--[\s\S]*?-->/g, (comment) => (hasInternalNote(comment, needles) ? "" : comment));
  text = text.replace(/<br\b[^>]*>/gi, "\n");

  for (let i = 0; i < 20; i += 1) {
    let changed = false;
    INNERMOST_BLOCK_RE.lastIndex = 0;
    text = text.replace(INNERMOST_BLOCK_RE, (block) => {
      const open = block.match(/^<[^>]+>/)?.[0];
      const close = block.match(/<\/[^>]+>$/i)?.[0];
      if (!open || !close) return block;
      const inner = block.slice(open.length, block.length - close.length);
      const cleaned = filterInternalLines(inner, needles);
      if (!visibleText(cleaned) || hasInternalNote(cleaned, needles)) {
        changed = true;
        return "";
      }
      if (cleaned !== inner) changed = true;
      return `${open}${cleaned}${close}`;
    });
    if (!changed) break;
  }

  text = filterInternalLines(text, needles);
  INNERMOST_BLOCK_RE.lastIndex = 0;
  text = text.replace(INNERMOST_BLOCK_RE, (block) => (visibleText(block) ? block : ""));
  return text.trim();
}

export function isHiddenFromCustomers(product) {
  if (HIDDEN_FROM_CUSTOMERS.has(String(product?.status || "").trim())) return true;
  // 가격이 0원(미입력)인 상품은 결제 자체가 불가능하므로 목록에 노출하지 않는다.
  if (!(Number(product?.price) > 0)) return true;
  return false;
}

// 손님용 상품 객체. supplier 키 자체를 넣지 않는다.
export function toPublicProduct(product, extraNeedles = []) {
  if (!product) return null;
  return {
    id: product.id,
    date: product.date,
    category: product.category,
    name: product.name,
    options: (product.options || []).map((option) => ({
      name: option.name,
      price: option.price,
      listPrice: option.listPrice,
      weightG: option.weightG,
    })),
    price: product.price,
    listPrice: product.listPrice,
    shippingFee: product.shippingFee,
    combinedShippingQty: product.combinedShippingQty,
    status: product.status,
    image: product.image,
    description: sanitizePublicDescription(product.description, extraNeedles),
    shippingCutoff: sanitizePublicDescription(product.shippingCutoff, extraNeedles),
    detailImage: product.detailImage,
    mdPick: product.mdPick,
  };
}

export function selectPublicProducts(products, extraNeedles = []) {
  return (products || [])
    .filter((product) => !isHiddenFromCustomers(product))
    .map((product) => toPublicProduct(product, extraNeedles));
}
