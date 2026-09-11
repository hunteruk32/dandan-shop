export default function StatsBanner({ productCount, categoryCount }) {
  return (
    <div className="stats-banner">
      <div>
        <div className="serif" style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
          단골이 늘어나는 이유, 딱 하나입니다
        </div>
        <div style={{ fontSize: 13, color: "#6B6250" }}>"가격은 도매, 물건은 산지 그대로" — 중간 유통 없이 직접 보내드려요.</div>
      </div>
      <div className="stats-banner-numbers">
        <div className="stat-item">
          <div className="stat-num">{productCount}+</div>
          <div className="stat-label">상시 판매 품목</div>
        </div>
        <div className="stat-item">
          <div className="stat-num">{categoryCount}</div>
          <div className="stat-label">취급 카테고리</div>
        </div>
      </div>
    </div>
  );
}
