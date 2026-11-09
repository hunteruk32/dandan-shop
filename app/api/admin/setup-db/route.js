import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAuth";
import { sql } from "@/lib/db";

// /admin에 로그인한 상태로 브라우저에서 이 주소를 한 번 열면 DB 테이블이 생성/갱신된다.
// scripts/init-db.mjs(터미널에서 실행하는 버전)와 같은 내용 — 터미널 없이 쓸 수 있게 만든 동일한 마이그레이션.
export async function GET() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return Response.json(
      { ok: false, error: "먼저 /admin/login에서 관리자 로그인을 해주세요." },
      { status: 401 }
    );
  }

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      path TEXT,
      product_id TEXT,
      session_id TEXT,
      qty INTEGER,
      amount INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS events_type_created_idx ON events (event_type, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS events_product_idx ON events (product_id) WHERE product_id IS NOT NULL`;
  await sql`CREATE INDEX IF NOT EXISTS events_session_idx ON events (session_id)`;

  await sql`
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGSERIAL PRIMARY KEY,
      product_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      author_name TEXT NOT NULL,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      content TEXT NOT NULL,
      photo_url TEXT,
      hidden BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS reviews_product_idx ON reviews (product_id, hidden, created_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS supplier_order_log (
      id BIGSERIAL PRIMARY KEY,
      order_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      supplier TEXT NOT NULL,
      method TEXT NOT NULL,
      ordered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (order_id, item_name)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS supplier_order_log_supplier_idx ON supplier_order_log (supplier, ordered_at)`;

  await sql`
    CREATE TABLE IF NOT EXISTS pending_card_orders (
      token TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id BIGSERIAL PRIMARY KEY,
      phone TEXT NOT NULL,
      purpose TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      attempts SMALLINT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS otp_codes_phone_purpose_idx ON otp_codes (phone, purpose, created_at)`;

  return Response.json({ ok: true, message: "DB 테이블 준비 완료 (events, reviews, supplier_order_log, pending_card_orders, otp_codes)" });
}
