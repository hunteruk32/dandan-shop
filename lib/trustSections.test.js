import test from "node:test";
import assert from "node:assert/strict";
import { parseTrustSections, hasAnyTrustSection } from "./trustSections.js";

test("empty row has no trust sections", () => {
  const trust = parseTrustSections({});
  assert.equal(hasAnyTrustSection(trust), false);
  assert.equal(trust.story, null);
  assert.deepEqual(trust.steps, []);
  assert.deepEqual(trust.faq, []);
});

test("parses story/tech blocks only when at least one field is filled", () => {
  const trust = parseTrustSections({
    trust_story_title: "브랜드 스토리",
    trust_story_body: "본문",
    trust_story_image: "https://example.com/a.jpg",
  });
  assert.deepEqual(trust.story, { title: "브랜드 스토리", body: "본문", image: "https://example.com/a.jpg" });
  assert.equal(trust.tech, null);
  assert.equal(hasAnyTrustSection(trust), true);
});

test("parses only non-empty numbered steps, skipping gaps", () => {
  const trust = parseTrustSections({
    trust_step1_title: "원물 경매",
    trust_step1_image: "https://example.com/1.jpg",
    trust_step3_title: "포장",
  });
  assert.deepEqual(trust.steps, [
    { title: "원물 경매", image: "https://example.com/1.jpg" },
    { title: "포장", image: "" },
  ]);
});

test("cook images filter out blanks and keep order", () => {
  const trust = parseTrustSections({
    trust_cook_title: "맛있는 요리",
    trust_cook_image1: "https://example.com/1.jpg",
    trust_cook_image2: "",
    trust_cook_image3: "https://example.com/3.jpg",
  });
  assert.deepEqual(trust.cook.images, ["https://example.com/1.jpg", "https://example.com/3.jpg"]);
});

test("faq requires a question, answer is optional", () => {
  const trust = parseTrustSections({
    trust_faq1_q: "손질 상태는요?",
    trust_faq1_a: "바로 조리 가능합니다.",
    trust_faq2_a: "질문 없이 답만 있으면 무시",
  });
  assert.deepEqual(trust.faq, [{ q: "손질 상태는요?", a: "바로 조리 가능합니다." }]);
});

test("size guide requires a label", () => {
  const trust = parseTrustSections({
    trust_size1_label: "300g 이상 (25~29cm)",
    trust_size1_note: "요리할 수 있는 딱 좋은 크기",
  });
  assert.deepEqual(trust.sizeGuide, [{ label: "300g 이상 (25~29cm)", note: "요리할 수 있는 딱 좋은 크기", image: "" }]);
});

test("cert images are pipe-separated and trimmed", () => {
  const trust = parseTrustSections({
    trust_cert_title: "인증서",
    trust_cert_images: " https://example.com/1.jpg | https://example.com/2.jpg ",
  });
  assert.deepEqual(trust.cert, {
    title: "인증서",
    images: ["https://example.com/1.jpg", "https://example.com/2.jpg"],
  });
});
