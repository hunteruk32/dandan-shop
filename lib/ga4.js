import { BetaAnalyticsDataClient } from "@google-analytics/data";

let cachedClient;

function getClient() {
  if (cachedClient !== undefined) return cachedClient;
  const raw = process.env.GA4_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    cachedClient = null;
    return cachedClient;
  }
  try {
    const credentials = JSON.parse(raw);
    cachedClient = new BetaAnalyticsDataClient({ credentials });
  } catch {
    cachedClient = null;
  }
  return cachedClient;
}

export function isGa4Configured() {
  return Boolean(process.env.GA4_PROPERTY_ID && process.env.GA4_SERVICE_ACCOUNT_KEY);
}

function toKstDateString(date) {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// 대시보드의 [startDate, endDate) 범위를 GA4 API가 요구하는 "YYYY-MM-DD" 종일 단위,
// 양끝 포함 범위로 변환한다 (endDate는 다음날 자정이라 1초 빼서 실제 마지막 날짜로 되돌린다).
function ga4DateRange(range) {
  return {
    startDate: toKstDateString(range.startDate),
    endDate: toKstDateString(new Date(range.endDate.getTime() - 1000)),
  };
}

// 선택된 기간의 세션당 평균 참여시간 · 세션수 · 참여율.
export async function getEngagementSummary(range) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const client = getClient();
  if (!client || !propertyId) return null;

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [ga4DateRange(range)],
      metrics: [
        { name: "userEngagementDuration" },
        { name: "sessions" },
        { name: "engagementRate" },
      ],
    });

    const row = response.rows?.[0];
    const duration = Number(row?.metricValues?.[0]?.value || 0);
    const sessions = Number(row?.metricValues?.[1]?.value || 0);
    const engagementRate = Number(row?.metricValues?.[2]?.value || 0);

    return {
      avgEngagementSec: sessions > 0 ? duration / sessions : 0,
      sessions,
      engagementRate: engagementRate * 100,
    };
  } catch (err) {
    console.error("GA4 getEngagementSummary failed:", err.message);
    return null;
  }
}

// 페이지별 평균 참여시간 상위 N개 — 선택된 기간 범위.
export async function getEngagementByPage(range, limit = 10) {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const client = getClient();
  if (!client || !propertyId) return [];

  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [ga4DateRange(range)],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "userEngagementDuration" }, { name: "sessions" }],
      orderBys: [{ metric: { metricName: "userEngagementDuration" }, desc: true }],
      limit,
    });

    return (response.rows || []).map((row) => {
      const pagePath = row.dimensionValues[0].value;
      const duration = Number(row.metricValues[0].value || 0);
      const sessions = Number(row.metricValues[1].value || 0);
      return {
        pagePath,
        sessions,
        avgEngagementSec: sessions > 0 ? duration / sessions : 0,
      };
    });
  } catch (err) {
    console.error("GA4 getEngagementByPage failed:", err.message);
    return [];
  }
}
