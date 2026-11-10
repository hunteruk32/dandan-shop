import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { VISITOR_COOKIE } from "@/lib/constants";
import { isValidProductId } from "@/lib/productId";

function extractProductId(path) {
  const m = /^\/product\/([^/?#]+)/.exec(path || "");
  if (!m) return null;
  // 깨진 링크·봇이 보낸 비정상 경로(예: 이중 인코딩된 문자열)는 상품으로 집계하지 않는다.
  return isValidProductId(m[1]) ? m[1] : null;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const path = String(body.path || "").slice(0, 500);
    if (!path) return Response.json({ ok: false }, { status: 400 });

    const sessionId = cookies().get(VISITOR_COOKIE)?.value || null;
    const productId = extractProductId(path);

    await sql`
      INSERT INTO events (event_type, path, product_id, session_id)
      VALUES ('pageview', ${path}, ${productId}, ${sessionId})
    `;
    return Response.json({ ok: true });
  } catch {
    // 트래킹 실패는 사용자 경험에 영향을 주면 안 되므로 조용히 무시
    return Response.json({ ok: false }, { status: 200 });
  }
}
