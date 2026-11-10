import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { VISITOR_COOKIE } from "@/lib/constants";
import { isValidProductId } from "@/lib/productId";

// 전환 퍼널 분석에 쓰는 커스텀 이벤트. pageview/order_item 외의 이벤트는 여기로 받되,
// 임의 문자열이 쌓이지 않도록 화이트리스트로 제한한다.
const ALLOWED_TYPES = new Set(["add_to_cart"]);

export async function POST(req) {
  try {
    const body = await req.json();
    const eventType = String(body.type || "");
    if (!ALLOWED_TYPES.has(eventType)) return Response.json({ ok: false }, { status: 400 });

    const rawProductId = body.productId ? String(body.productId).slice(0, 50) : null;
    const productId = isValidProductId(rawProductId) ? rawProductId : null;
    const sessionId = cookies().get(VISITOR_COOKIE)?.value || null;

    await sql`
      INSERT INTO events (event_type, product_id, session_id)
      VALUES (${eventType}, ${productId}, ${sessionId})
    `;
    return Response.json({ ok: true });
  } catch {
    // 트래킹 실패는 사용자 경험에 영향을 주면 안 되므로 조용히 무시
    return Response.json({ ok: false }, { status: 200 });
  }
}
