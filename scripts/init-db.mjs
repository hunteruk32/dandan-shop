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
  console.log("done: events table ready");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
