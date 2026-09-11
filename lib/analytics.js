import { sql } from "./db";

export const PERIODS = {
  day: { label: "일별", trunc: "day", buckets: 30, windowDays: 31 },
  week: { label: "주별", trunc: "week", buckets: 16, windowDays: 16 * 7 + 7 },
  month: { label: "월별", trunc: "month", buckets: 12, windowDays: 13 * 31 },
  quarter: { label: "분기별", trunc: "quarter", buckets: 8, windowDays: 9 * 93 },
  half: { label: "반기별", trunc: null, buckets: 6 }, // 커스텀 처리
  year: { label: "연간", trunc: "year", buckets: 5, windowDays: 6 * 366 },
};

const TZ = "Asia/Seoul";

// 방문/주문 등 이벤트를 기간 단위(일/주/월/분기/연)로 집계.
// 라벨은 반드시 SQL(to_char)에서 텍스트로 만들어서 돌려준다 — bucket을 JS Date로 다시 파싱하면
// "타임존 없는 벽시계 시각 문자열"을 로컬 타임존(배포 환경은 UTC, 로컬 개발은 KST)에 따라 서로
// 다르게 해석해버려서 날짜가 하루씩 밀리는 문제가 생기기 때문.
// date_trunc/to_char의 두 번째 인자는 일반 텍스트 값이라 바인드 파라미터로 그대로 넘겨도 된다
// (raw SQL 조립이 필요 없음). trunc는 PERIODS 화이트리스트에서만 오는 값이라 안전하다.
// interval 리터럴은 'quarter' 단위를 지원하지 않아서, 조회 범위는 항상 일수(day)로 계산한다.
async function bucketedCountsStandard(eventType, trunc, windowDays) {
  const format =
    trunc === "year" ? 'YYYY"년"' :
    trunc === "quarter" ? 'YYYY."Q"Q' :
    trunc === "month" ? "YYYY.MM" :
    trunc === "week" ? 'MM/DD"주"' :
    "MM/DD";

  const rows = await sql`
    SELECT
      date_trunc(${trunc}, created_at AT TIME ZONE ${TZ}) AS bucket_sort,
      to_char(date_trunc(${trunc}, created_at AT TIME ZONE ${TZ}), ${format}) AS bucket,
      COUNT(*)::int AS count
    FROM events
    WHERE event_type = ${eventType}
      AND created_at >= now() - (${windowDays} || ' days')::interval
    GROUP BY 1, 2
    ORDER BY 1 ASC
  `;
  return rows.map((r) => ({ bucket: r.bucket, count: r.count }));
}

// 반기(半期)는 Postgres date_trunc에 없어서 직접 계산. 라벨도 SQL에서 문자열로 만든다.
async function bucketedCountsHalf(eventType, halves) {
  const rows = await sql`
    SELECT
      to_char(date_trunc('year', created_at AT TIME ZONE ${TZ}), 'YYYY') AS year_label,
      date_trunc('year', created_at AT TIME ZONE ${TZ}) AS year_sort,
      CASE WHEN EXTRACT(MONTH FROM created_at AT TIME ZONE ${TZ}) <= 6 THEN 1 ELSE 2 END AS half,
      COUNT(*)::int AS count
    FROM events
    WHERE event_type = ${eventType}
      AND created_at >= now() - (${halves} || ' years')::interval
    GROUP BY 1, 2, 3
    ORDER BY 2 ASC, 3 ASC
  `;
  return rows.map((r) => ({ bucket: `${r.year_label}년 ${r.half}반기`, count: r.count }));
}

// period: 'day' | 'week' | 'month' | 'quarter' | 'half' | 'year'
export async function getTimeSeries(eventType, period) {
  const cfg = PERIODS[period] || PERIODS.day;
  if (period === "half") return bucketedCountsHalf(eventType, cfg.buckets);
  return bucketedCountsStandard(eventType, cfg.trunc, cfg.windowDays);
}

export async function getSummary() {
  const [today, total, todayOrders, totalOrders, todayRevenue] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_type = 'pageview' AND created_at >= date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ}`,
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_type = 'pageview'`,
    sql`SELECT COUNT(DISTINCT session_id)::int AS c FROM events WHERE event_type = 'order_item' AND created_at >= date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ}`,
    sql`SELECT COUNT(DISTINCT session_id)::int AS c FROM events WHERE event_type = 'order_item'`,
    sql`SELECT COALESCE(SUM(amount), 0)::int AS s FROM events WHERE event_type = 'order_item' AND created_at >= date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ}`,
  ]);

  const todayVisits = today[0].c;
  const totalVisits = total[0].c;
  const todayOrderCount = todayOrders[0].c;
  const totalOrderCount = totalOrders[0].c;
  const todaySales = todayRevenue[0].s;

  const [uniqueSessionsAllTime] = await sql`
    SELECT COUNT(DISTINCT session_id)::int AS c FROM events WHERE event_type = 'pageview'
  `;
  const conversionRate = uniqueSessionsAllTime.c > 0 ? (totalOrderCount / uniqueSessionsAllTime.c) * 100 : 0;

  return { todayVisits, totalVisits, todayOrderCount, totalOrderCount, todaySales, conversionRate };
}

// 상품별 클릭수(상세페이지 조회수) · 구매수 · 판매율
export async function getProductPerformance() {
  const rows = await sql`
    WITH clicks AS (
      SELECT product_id, COUNT(*)::int AS click_count
      FROM events
      WHERE event_type = 'pageview' AND product_id IS NOT NULL
      GROUP BY product_id
    ),
    purchases AS (
      SELECT product_id, SUM(qty)::int AS purchase_qty, SUM(amount)::int AS revenue
      FROM events
      WHERE event_type = 'order_item' AND product_id IS NOT NULL
      GROUP BY product_id
    )
    SELECT
      COALESCE(c.product_id, p.product_id) AS product_id,
      COALESCE(c.click_count, 0) AS click_count,
      COALESCE(p.purchase_qty, 0) AS purchase_qty,
      COALESCE(p.revenue, 0) AS revenue
    FROM clicks c
    FULL OUTER JOIN purchases p ON c.product_id = p.product_id
    ORDER BY click_count DESC
  `;
  return rows.map((r) => ({
    productId: r.product_id,
    clickCount: r.click_count,
    purchaseQty: r.purchase_qty,
    revenue: r.revenue,
    sellThroughRate: r.click_count > 0 ? (r.purchase_qty / r.click_count) * 100 : 0,
  }));
}

// 시간대별(0~23시) 방문 분포
export async function getHourlyDistribution(days = 30) {
  const rows = await sql`
    SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE ${TZ})::int AS hour, COUNT(*)::int AS count
    FROM events
    WHERE event_type = 'pageview' AND created_at >= now() - (${days} || ' days')::interval
    GROUP BY hour
    ORDER BY hour ASC
  `;
  const byHour = new Map(rows.map((r) => [r.hour, r.count]));
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: byHour.get(h) || 0 }));
}
