import { getProducts } from "@/lib/sheet";
import { getSummary, getTimeSeries, getProductPerformance, getHourlyDistribution, PERIODS } from "@/lib/analytics";
import AdminLogoutButton from "../AdminLogoutButton";

export const dynamic = "force-dynamic";

function KpiCard({ label, value, sub }) {
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px", flex: "1 1 140px" }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
      {sub ? <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{sub}</div> : null}
    </div>
  );
}

function BarChart({ data, labelKey, valueKey, height = 120 }) {
  const max = Math.max(1, ...data.map((d) => d[valueKey]));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, overflowX: "auto", padding: "4px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "1 0 auto", minWidth: 22 }}>
          <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{d[valueKey] || ""}</div>
          <div
            style={{
              width: 16,
              height: Math.max(2, (d[valueKey] / max) * (height - 30)),
              background: "var(--accent)",
              borderRadius: 3,
            }}
          />
          <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 4, whiteSpace: "nowrap" }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage({ searchParams }) {
  const period = PERIODS[searchParams?.period] ? searchParams.period : "day";

  const [summary, visitSeries, orderSeries, productPerf, hourly, products] = await Promise.all([
    getSummary(),
    getTimeSeries("pageview", period),
    getTimeSeries("order_item", period),
    getProductPerformance(),
    getHourlyDistribution(30),
    getProducts(),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="wrap" style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 className="serif" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>단단상회 분석 대시보드</h1>
        <AdminLogoutButton />
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiCard label="오늘 방문수" value={summary.todayVisits.toLocaleString()} />
        <KpiCard label="누적 방문수" value={summary.totalVisits.toLocaleString()} />
        <KpiCard label="오늘 매출" value={`${summary.todaySales.toLocaleString()}원`} />
        <KpiCard label="전환율 (전체 기간)" value={`${summary.conversionRate.toFixed(1)}%`} sub="방문 세션 대비 구매 세션 비율" />
      </div>

      <div className="section-head">
        <h2 className="section-title">기간별 추이</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {Object.entries(PERIODS).map(([key, cfg]) => (
            <a
              key={key}
              href={`/admin?period=${key}`}
              className={`tab ${period === key ? "active" : ""}`}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              {cfg.label}
            </a>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>방문수</div>
        <BarChart data={visitSeries} labelKey="bucket" valueKey="count" />
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 8 }}>주문 건수</div>
        <BarChart data={orderSeries} labelKey="bucket" valueKey="count" />
      </div>

      <div className="section-head">
        <h2 className="section-title">시간대별 방문 분포 (최근 30일)</h2>
      </div>
      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 28 }}>
        <BarChart data={hourly} labelKey="hour" valueKey="count" height={100} />
      </div>

      <div className="section-head">
        <h2 className="section-title">상품별 성과</h2>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>조회수(클릭수) 많은 순</div>
      </div>
      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 40 }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F6F4EE", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>상품</th>
                <th style={{ padding: "10px 14px" }}>카테고리</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>클릭수</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>구매수</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>판매율</th>
                <th style={{ padding: "10px 14px", textAlign: "right" }}>매출</th>
              </tr>
            </thead>
            <tbody>
              {productPerf.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>
                    아직 쌓인 데이터가 없어요. 방문자가 생기면 여기 표시됩니다.
                  </td>
                </tr>
              ) : (
                productPerf.map((row) => {
                  const p = productMap.get(row.productId);
                  return (
                    <tr key={row.productId} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 700 }}>{p ? p.name : row.productId}</td>
                      <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{p ? p.category : "-"}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>{row.clickCount.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>{row.purchaseQty.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>{row.sellThroughRate.toFixed(1)}%</td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>{row.revenue.toLocaleString()}원</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
