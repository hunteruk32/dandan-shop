// 상품 상세페이지의 "신뢰 섹션"(브랜드 스토리·차별화 기술·공정 4단계·조리 비주얼·Q&A·
// 크기 안내·인증서) 파싱. 상품마스터 시트에 trust_* 열을 채워두면 그 상품에만 해당 섹션이
// 뜨고, 비워두면 그 섹션은 그냥 안 뜬다(상품마다 다 채울 필요 없음) — app/product/[id]/
// ProductTrustSections.jsx가 실제 렌더링을 담당한다.

function cell(r, key) {
  return String(r[key] || "").trim();
}

function parseTitledBlock(r, prefix) {
  const title = cell(r, `${prefix}_title`);
  const body = cell(r, `${prefix}_body`);
  const image = cell(r, `${prefix}_image`);
  if (!title && !body && !image) return null;
  return { title, body, image };
}

const MAX_STEPS = 6;
function parseSteps(r) {
  const steps = [];
  for (let i = 1; i <= MAX_STEPS; i++) {
    const title = cell(r, `trust_step${i}_title`);
    const image = cell(r, `trust_step${i}_image`);
    if (title || image) steps.push({ title, image });
  }
  return steps;
}

function parseCook(r) {
  const title = cell(r, "trust_cook_title");
  const body = cell(r, "trust_cook_body");
  const images = [1, 2, 3]
    .map((i) => cell(r, `trust_cook_image${i}`))
    .filter(Boolean);
  if (!title && !body && images.length === 0) return null;
  return { title, body, images };
}

const MAX_FAQ = 5;
function parseFaq(r) {
  const faq = [];
  for (let i = 1; i <= MAX_FAQ; i++) {
    const q = cell(r, `trust_faq${i}_q`);
    const a = cell(r, `trust_faq${i}_a`);
    if (q) faq.push({ q, a });
  }
  return faq;
}

const MAX_SIZE_TIERS = 5;
function parseSizeGuide(r) {
  const tiers = [];
  for (let i = 1; i <= MAX_SIZE_TIERS; i++) {
    const label = cell(r, `trust_size${i}_label`);
    const note = cell(r, `trust_size${i}_note`);
    const image = cell(r, `trust_size${i}_image`);
    if (label) tiers.push({ label, note, image });
  }
  return tiers;
}

function parseCert(r) {
  const title = cell(r, "trust_cert_title");
  const images = cell(r, "trust_cert_images")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!title && images.length === 0) return null;
  return { title, images };
}

export function parseTrustSections(r) {
  return {
    story: parseTitledBlock(r, "trust_story"),
    tech: parseTitledBlock(r, "trust_tech"),
    steps: parseSteps(r),
    cook: parseCook(r),
    faq: parseFaq(r),
    sizeGuide: parseSizeGuide(r),
    cert: parseCert(r),
  };
}

export function hasAnyTrustSection(trust) {
  if (!trust) return false;
  return !!(
    trust.story ||
    trust.tech ||
    trust.steps.length ||
    trust.cook ||
    trust.faq.length ||
    trust.sizeGuide.length ||
    trust.cert
  );
}
