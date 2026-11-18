"use client";

// 상품별 성과 테이블의 카테고리 필터 — 기존 period/from/to 쿼리는 그대로 두고 cat만 바꿔서
// 페이지를 다시 불러온다(서버 컴포넌트 데이터 조회 로직 재사용).
export default function CategoryFilterSelect({ categories, value, period, from, to }) {
  return (
    <form method="get" style={{ display: "inline-block" }}>
      <input type="hidden" name="period" value={period} />
      {from ? <input type="hidden" name="from" value={from} /> : null}
      {to ? <input type="hidden" name="to" value={to} /> : null}
      <select
        name="cat"
        defaultValue={value}
        onChange={(e) => e.target.form.requestSubmit()}
        className="input"
        style={{ fontSize: 12, padding: "6px 10px" }}
      >
        <option value="all">전체 카테고리</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </form>
  );
}
