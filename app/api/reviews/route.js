import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { getProductById } from "@/lib/sheet";
import { verifyPurchaseAndGetAuthorName, createReview } from "@/lib/reviews";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req) {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.phone) {
    return Response.json({ ok: false, error: "로그인이 필요해요." }, { status: 401 });
  }

  const formData = await req.formData();
  const productId = String(formData.get("productId") || "").trim();
  const rating = Number(formData.get("rating"));
  const content = String(formData.get("content") || "").trim();
  const photo = formData.get("photo");

  if (!productId) return Response.json({ ok: false, error: "잘못된 요청이에요." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ ok: false, error: "별점을 선택해주세요." }, { status: 400 });
  }
  if (!content || content.length < 5) {
    return Response.json({ ok: false, error: "후기 내용을 5자 이상 적어주세요." }, { status: 400 });
  }
  if (content.length > 1000) {
    return Response.json({ ok: false, error: "후기 내용이 너무 길어요." }, { status: 400 });
  }

  const product = await getProductById(productId);
  if (!product) return Response.json({ ok: false, error: "상품을 찾을 수 없어요." }, { status: 404 });

  const authorName = await verifyPurchaseAndGetAuthorName(session.phone, product.name);
  if (!authorName) {
    return Response.json({ ok: false, error: "이 상품을 구매하신 분만 후기를 남길 수 있어요." }, { status: 403 });
  }

  let photoUrl = null;
  if (photo && typeof photo === "object" && photo.size > 0) {
    if (!ALLOWED_PHOTO_TYPES.has(photo.type)) {
      return Response.json({ ok: false, error: "사진은 jpg/png/webp/gif 형식만 가능해요." }, { status: 400 });
    }
    if (photo.size > MAX_PHOTO_BYTES) {
      return Response.json({ ok: false, error: "사진 용량은 5MB 이하로 올려주세요." }, { status: 400 });
    }
    const ext = photo.type.split("/")[1] || "jpg";
    const blob = await put(`reviews/${productId}-${Date.now()}.${ext}`, photo, { access: "public" });
    photoUrl = blob.url;
  }

  const id = await createReview({ productId, phone: session.phone, authorName, rating, content, photoUrl });
  return Response.json({ ok: true, id, authorName });
}
