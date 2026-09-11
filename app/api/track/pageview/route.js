import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { VISITOR_COOKIE } from "@/lib/constants";

function extractProductId(path) {
  const m = /^\/product\/([^/?#]+)/.exec(path || "");
  return m ? m[1] : null;
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
