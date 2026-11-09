import { sql } from "./db";
import { getOrders, baseItemName, getProducts } from "./sheet";

function maskName(name) {
  const trimmed = String(name || "").trim();
  if (trimmed.length <= 1) return trimmed || "구매자";
  return trimmed[0] + "*".repeat(trimmed.length - 1);
}

// 이 전화번호로 해당 상품을 실제로 주문한 적이 있는지 확인하고, 있으면 마스킹된
// 작성자 이름을 돌려준다(실명은 절대 리뷰에 노출하지 않는다). 없으면 null.
export async function verifyPurchaseAndGetAuthorName(phone, productName) {
  const normalized = String(phone || "").replace(/[^0-9]/g, "");
  if (!normalized || !productName) return null;
  const orders = await getOrders();
  for (const o of orders) {
    if (baseItemName(o.item) !== productName) continue;
    if (o.senderPhone.replace(/[^0-9]/g, "") === normalized) return maskName(o.senderName);
    if (o.recipientPhone.replace(/[^0-9]/g, "") === normalized) return maskName(o.recipientName);
  }
  return null;
}

export async function getReviews(productId) {
  const rows = await sql`
    SELECT id, author_name, rating, content, photo_url, created_at
    FROM reviews
    WHERE product_id = ${productId} AND hidden = false
    ORDER BY created_at DESC
  `;
  const average = rows.length ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length : 0;
  return {
    reviews: rows.map((r) => ({
      id: r.id,
      authorName: r.author_name,
      rating: r.rating,
      content: r.content,
      photoUrl: r.photo_url,
      createdAt: r.created_at,
    })),
    average,
    count: rows.length,
  };
}

// 홈페이지 "실시간 구매 후기" 티커용 — 전체 상품을 통틀어 최근 후기를 가져온다.
// 삭제/비노출된 상품을 가리키는 후기는 링크가 끊기므로 걸러낸다.
export async function getRecentPublicReviews(limit = 24) {
  const rows = await sql`
    SELECT id, product_id, author_name, rating, content, created_at
    FROM reviews
    WHERE hidden = false
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  if (rows.length === 0) return [];

  const products = await getProducts();
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  return rows
    .map((r) => ({
      id: r.id,
      productId: r.product_id,
      productName: nameById.get(r.product_id),
      authorName: r.author_name,
      rating: r.rating,
      content: r.content,
      createdAt: r.created_at,
    }))
    .filter((r) => r.productName);
}

export async function createReview({ productId, phone, authorName, rating, content, photoUrl }) {
  const [row] = await sql`
    INSERT INTO reviews (product_id, phone, author_name, rating, content, photo_url)
    VALUES (${productId}, ${phone}, ${authorName}, ${rating}, ${content}, ${photoUrl || null})
    RETURNING id
  `;
  return row.id;
}

export async function getAllReviewsForAdmin(limit = 200) {
  const rows = await sql`
    SELECT id, product_id, author_name, rating, content, photo_url, hidden, created_at
    FROM reviews
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.id,
    productId: r.product_id,
    authorName: r.author_name,
    rating: r.rating,
    content: r.content,
    photoUrl: r.photo_url,
    hidden: r.hidden,
    createdAt: r.created_at,
  }));
}

export async function setReviewHidden(id, hidden) {
  await sql`UPDATE reviews SET hidden = ${hidden} WHERE id = ${id}`;
}
