// 분석용 이벤트 테이블 생성 스크립트. 최초 1회, 또는 스키마 변경 시 다시 실행합니다.
//   node scripts/init-db.mjs
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.join(__dirname, "..", ".env.local") });

const sql = neon(process.env.DATABASE_URL);

async function main() {
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

  // 매입처별 발주 이력. 같은 주문의 같은 품목을 다음날 또 발주 목록에 올리지 않기 위한 중복 방지용.
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

  console.log("done: events, reviews, supplier_order_log tables ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
