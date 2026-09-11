import ProductGridCard from "./ProductGridCard";

export default function BestProducts({ products }) {
  const sold = products.filter((p) => p.salesCount > 0);
  const best = (sold.length >= 4 ? sold : products)
    .slice()
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 4);

  if (best.length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <div className="section-head">
        <div>
          <h2 className="section-title">이번 주 베스트</h2>
          <p className="section-sub">가장 많이 주문된 상품</p>
        </div>
      </div>
      <div className="card-grid">
        {best.map((p, i) => (
          <ProductGridCard key={p.id} product={p} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
