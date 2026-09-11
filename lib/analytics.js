import { sql } from "./db";

export const PERIODS = {
  day: { label: "일별", trunc: "day", windowDays: 31 },
  week: { label: "주별", trunc: "week", windowDays: 16 * 7 + 7 },
  month: { label: "월별", trunc: "month", windowDays: 13 * 31 },
  quarter: { label: "분기별", trunc: "quarter", windowDays: 9 * 93 },
  half: { label: "반기별", trunc: null, windowDays: 6 * 366 }, // 버킷은 커스텀 처리
  year: { label: "연간", trunc: "year", windowDays: 6 * 366 },
  custom: { label: "직접입력", trunc: null, windowDays: 31 },
};

const TZ = "Asia/Seoul";
const DAY_MS = 24 * 60 * 60 * 1000;

// period + (period==='custom'일 때) from/to("YYYY-MM-DD")를 실제 [startDate, endDate) 범위로 바꾼다.
// 대시보드의 모든 지표(추이·전환율·시간대별·상품성과)가 이 범위 하나를 공유해서
// "선택한 기간에 맞춰 다 같이 바뀌는" 동작이 되게 한다.
export function resolveRange(period, from, to) {
  if (period === "custom" && from && to) {
    const startDate = new Date(`${from}T00:00:00+09:00`);
    const endDate = new Date(`${to}T00:00:00+09:00`);
    endDate.setUTCDate(endDate.getUTCDate() + 1); // to 날짜 자정까지 포함
    if (!isNaN(startDate) && !isNaN(endDate) && startDate < endDate) {
      return { startDate, endDate, label: `${from} ~ ${to}` };
    }
  }
  const cfg = PERIODS[period] || PERIODS.day;
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - cfg.windowDays * DAY_MS);
  return { startDate, endDate, label: cfg.label };
}

function truncForRange(period, startDate, endDate) {
  if (period && period !== "custom" && PERIODS[period]?.trunc) return PERIODS[period].trunc;
  const days = (endDate - startDate) / DAY_MS;
  if (days <= 62) return "day";
  if (days <= 210) return "week";
  if (days <= 900) return "month";
  return "quarter";
}

// 방문/주문 등 이벤트를 기간 단위(일/주/월/분기/연)로 집계.
// 라벨은 반드시 SQL(to_char)에서 텍스트로 만들어서 돌려준다 — bucket을 JS Date로 다시 파싱하면
// "타임존 없는 벽시계 시각 문자열"을 로컬 타임존(배포 환경은 UTC, 로컬 개발은 KST)에 따라 서로
// 다르게 해석해버려서 날짜가 하루씩 밀리는 문제가 생기기 때문.
// trunc는 PERIODS 화이트리스트 또는 truncForRange에서만 오는 값이라 안전하다.
async function bucketedCountsStandard(eventType, trunc, startDate, endDate) {
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
      AND created_at >= ${startDate} AND created_at < ${endDate}
    GROUP BY 1, 2
    ORDER BY 1 ASC
  `;
  return rows.map((r) => ({ bucket: r.bucket, count: r.count }));
}

// 반기(半期)는 Postgres date_trunc에 없어서 직접 계산. 라벨도 SQL에서 문자열로 만든다.
async function bucketedCountsHalf(eventType, startDate, endDate) {
  const rows = await sql`
    SELECT
      to_char(date_trunc('year', created_at AT TIME ZONE ${TZ}), 'YYYY') AS year_label,
      date_trunc('year', created_at AT TIME ZONE ${TZ}) AS year_sort,
      CASE WHEN EXTRACT(MONTH FROM created_at AT TIME ZONE ${TZ}) <= 6 THEN 1 ELSE 2 END AS half,
      COUNT(*)::int AS count
    FROM events
    WHERE event_type = ${eventType}
      AND created_at >= ${startDate} AND created_at < ${endDate}
    GROUP BY 1, 2, 3
    ORDER BY 2 ASC, 3 ASC
  `;
  return rows.map((r) => ({ bucket: `${r.year_label}년 ${r.half}반기`, count: r.count }));
}

// period: 'day' | 'week' | 'month' | 'quarter' | 'half' | 'year' | 'custom'
export async function getTimeSeries(eventType, period, range) {
  if (period === "half") return bucketedCountsHalf(eventType, range.startDate, range.endDate);
  const trunc = truncForRange(period, range.startDate, range.endDate);
  return bucketedCountsStandard(eventType, trunc, range.startDate, range.endDate);
}

// "오늘"/"누적"은 항상 실시간 기준(기간 선택과 무관), 전환율만 선택된 기간 범위로 계산한다.
export async function getSummary(range) {
  const [today, total, todayRevenue, rangeVisits, rangePurchasers] = await Promise.all([
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_type = 'pageview' AND created_at >= date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ}`,
    sql`SELECT COUNT(*)::int AS c FROM events WHERE event_type = 'pageview'`,
    sql`SELECT COALESCE(SUM(amount), 0)::int AS s FROM events WHERE event_type = 'order_item' AND created_at >= date_trunc('day', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ}`,
    sql`SELECT COUNT(DISTINCT session_id)::int AS c FROM events WHERE event_type = 'pageview' AND created_at >= ${range.startDate} AND created_at < ${range.endDate}`,
    sql`SELECT COUNT(DISTINCT session_id)::int AS c FROM events WHERE event_type = 'order_item' AND created_at >= ${range.startDate} AND created_at < ${range.endDate}`,
  ]);

  const todayVisits = today[0].c;
  const totalVisits = total[0].c;
  const todaySales = todayRevenue[0].s;
  const visitSessions = rangeVisits[0].c;
  const purchaseSessions = rangePurchasers[0].c;
  const conversionRate = visitSessions > 0 ? (purchaseSessions / visitSessions) * 100 : 0;

  return { todayVisits, totalVisits, todaySales, conversionRate };
}

// 상품별 클릭수(상세페이지 조회수) · 구매수 · 판매율 — 선택된 기간 범위 내로 한정.
export async function getProductPerformance(range) {
  const rows = await sql`
    WITH clicks AS (
      SELECT product_id, COUNT(*)::int AS click_count
      FROM events
      WHERE event_type = 'pageview' AND product_id IS NOT NULL
        AND created_at >= ${range.startDate} AND created_at < ${range.endDate}
      GROUP BY product_id
    ),
    purchases AS (
      SELECT product_id, SUM(qty)::int AS purchase_qty, SUM(amount)::int AS revenue
      FROM events
      WHERE event_type = 'order_item' AND product_id IS NOT NULL
        AND created_at >= ${range.startDate} AND created_at < ${range.endDate}
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

// 시간대별(0~23시) 방문 분포 — 선택된 기간 범위 내로 한정.
export async function getHourlyDistribution(range) {
  const rows = await sql`
    SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE ${TZ})::int AS hour, COUNT(*)::int AS count
    FROM events
    WHERE event_type = 'pageview' AND created_at >= ${range.startDate} AND created_at < ${range.endDate}
    GROUP BY hour
    ORDER BY hour ASC
  `;
  const byHour = new Map(rows.map((r) => [r.hour, r.count]));
  return Array.from({ length: 24 }, (_, h) => ({ hour: h, count: byHour.get(h) || 0 }));
}
