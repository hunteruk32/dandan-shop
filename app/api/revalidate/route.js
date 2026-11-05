import { revalidateTag } from "next/cache";

// 매입현황시트가 주문을 쓸 때마다(Apps Script) 호출해서, 60초 캐시를 기다리지 않고
// "내 주문 확인"·상품 목록을 바로 새로고침한다. REVALIDATE_SECRET이 맞아야 동작한다.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const secret = String(body.secret || "");

  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const tag = ["orders", "products"].includes(body.tag) ? body.tag : "orders";
  revalidateTag(tag);

  return Response.json({ ok: true, tag });
}
