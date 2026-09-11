import Link from "next/link";
import { STATUS_STYLE } from "@/lib/sheet";
import { getDiscount } from "@/lib/pricing";

export default function ProductGridCard({ product, rank }) {
  const s = STATUS_STYLE[product.status] || STATUS_STYLE["주문가능"];
  const discount = getDiscount(product.listPrice, product.price);
  return (
    <Link href={`/product/${product.id}`} className="grid-card">
      <div style={{ position: "relative" }}>
        {product.image ? (
          <img className="grid-card-thumb" src={product.image} alt={product.name} />
        ) : (
          <div className="grid-card-thumb" />
        )}
        {rank ? (
          <span
            className="badge"
            style={{ position: "absolute", top: 8, left: 8, background: "var(--spice)", color: "#fff" }}
          >
            BEST {rank}
          </span>
        ) : null}
        {discount ? (
          <span
            className="badge"
            style={{ position: "absolute", top: 8, right: 8, background: "var(--spice)", color: "#fff", fontWeight: 800 }}
          >
            {discount.rate}%
          </span>
        ) : null}
      </div>
      <div className="grid-card-body">
        <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{product.category}</div>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, lineHeight: 1.35 }}>{product.name}</div>
        {discount ? (
          <div style={{ fontSize: 12, color: "var(--muted)", textDecoration: "line-through", marginBottom: 1 }}>
            {discount.listPrice.toLocaleString()}원
          </div>
        ) : null}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            {discount ? <span style={{ fontWeight: 800, fontSize: 13, color: "var(--spice)" }}>{discount.rate}%</span> : null}
            <div className="price" style={{ margin: 0 }}>
              {product.price.toLocaleString()}원{product.options.length > 1 ? "부터" : ""}
            </div>
          </div>
          <span className="badge" style={{ background: s.bg, color: s.fg }}>{product.status}</span>
        </div>
      </div>
    </Link>
  );
}
