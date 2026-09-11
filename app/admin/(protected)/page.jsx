import Link from "next/link";
import { getProducts } from "@/lib/sheet";
import { getSummary, getTimeSeries, getProductPerformance, getHourlyDistribution, resolveRange, PERIODS } from "@/lib/analytics";
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

function toDateInputValue(d) {
  return d.toISOString().slice(0, 10);
}

export default async function AdminDashboardPage({ searchParams }) {
  const period = PERIODS[searchParams?.period] ? searchParams.period : "day";
  const from = searchParams?.from || "";
  const to = searchParams?.to || "";
  const range = resolveRange(period, from, to);

  const [summary, visitSeries, orderSeries, productPerf, hourly, products] = await Promise.all([
    getSummary(range),
    getTimeSeries("pageview", period, range),
    getTimeSeries("order_item", period, range),
    getProductPerformance(range),
    getHourlyDistribution(range),
    getProducts(),
  ]);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const presetPeriods = Object.entries(PERIODS).filter(([key]) => key !== "custom");

  return (
    <div className="wrap" style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 className="serif" style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>단단상회 분석 대시보드</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link href="/admin/reviews" style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>리뷰 관리</Link>
          <AdminLogoutButton />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <KpiCard label="오늘 방문수" value={summary.todayVisits.toLocaleString()} />
        <KpiCard label="누적 방문수" value={summary.totalVisits.toLocaleString()} />
        <KpiCard label="오늘 매출" value={`${summary.todaySales.toLocaleString()}원`} />
        <KpiCard label={`전환율 (${range.label})`} value={`${summary.conversionRate.toFixed(1)}%`} sub="방문 세션 대비 구매 세션 비율" />
      </div>

      <div className="section-head">
        <h2 className="section-title">기간별 추이</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {presetPeriods.map(([key, cfg]) => (
            <a
              key={key}
              href={`/admin?period=${key}`}
              className={`tab ${period === key ? "active" : ""}`}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              {cfg.label}
            </a>
          ))}
          <details style={{ position: "relative" }} open={period === "custom" ? true : undefined}>
            <summary
              className={`tab ${period === "custom" ? "active" : ""}`}
              style={{ fontSize: 12, padding: "6px 12px", cursor: "pointer", listStyle: "none" }}
            >
              직접입력
            </summary>
            <form
              method="get"
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                zIndex: 10,
                background: "#fff",
                border: "1px solid var(--line)",
                borderRadius: 10,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                whiteSpace: "nowrap",
              }}
            >
              <input type="hidden" name="period" value="custom" />
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="date"
                  name="from"
                  defaultValue={from || toDateInputValue(range.startDate)}
                  className="input"
                  style={{ padding: "6px 8px", fontSize: 12, width: 140 }}
                  required
                />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>~</span>
                <input
                  type="date"
                  name="to"
                  defaultValue={to || toDateInputValue(new Date())}
                  className="input"
                  style={{ padding: "6px 8px", fontSize: 12, width: 140 }}
                  required
                />
              </div>
              <button className="btn" type="submit" style={{ fontSize: 12, padding: "8px 10px" }}>조회</button>
            </form>
          </details>
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
        <h2 className="section-title">시간대별 방문 분포</h2>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{range.label}</div>
      </div>
      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 28 }}>
        <BarChart data={hourly} labelKey="hour" valueKey="count" height={100} />
      </div>

      <div className="section-head">
        <h2 className="section-title">상품별 성과</h2>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{range.label} · 조회수(클릭수) 많은 순</div>
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
                    이 기간에는 쌓인 데이터가 없어요.
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
