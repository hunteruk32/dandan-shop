import Link from "next/link";
import { STATUS_STYLE } from "@/lib/catalog";
import { getDiscount, getDisplayStartOption } from "@/lib/pricing";

export default function ProductGridCard({ product, rank }) {
  const s = STATUS_STYLE[product.status] || STATUS_STYLE["주문가능"];
  const startOption = getDisplayStartOption(product.options);
  const startPrice = startOption ? startOption.price : product.price;
  const startListPrice = startOption ? startOption.listPrice : product.listPrice;
  const discount = getDiscount(startListPrice, startPrice);
  return (
    <Link href={`/product/${product.id}`} className="grid-card">
      <div style={{ position: "relative" }}>
        {product.image ? (
          <img className="grid-card-thumb" src={product.image} alt={product.name} loading="lazy" />
        ) : (
          <div className="grid-card-thumb" />
        )}
        {rank ? (
          <span
            className="badge"
            style={{ position: "absolute", top: 8, left: 8, background: "var(--ink)", color: "#fff" }}
          >
            BEST {rank}
          </span>
        ) : null}
      </div>
      <div className="grid-card-body">
        <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 3 }}>{product.category}</div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 14,
            marginBottom: 8,
            lineHeight: 1.35,
            color: "var(--title)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.name}
        </div>
        <div className="grid-card-price-row">
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            {discount ? <span style={{ fontWeight: 800, fontSize: 13, color: "var(--ink)" }}>{discount.rate}%</span> : null}
            <div className="price" style={{ margin: 0 }}>
              {startPrice.toLocaleString()}원{product.options.length > 1 ? "부터" : ""}
            </div>
          </div>
          {product.status === "품절" ? (
            <span className="badge" style={{ borderColor: s.border, color: s.fg }}>{product.status}</span>
          ) : null}
        </div>
        {discount ? (
          <div style={{ fontSize: 12, color: "var(--muted)", textDecoration: "line-through", marginTop: 2 }}>
            {discount.listPrice.toLocaleString()}원
          </div>
        ) : null}
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          배송비 {product.shippingFee ? `${product.shippingFee.toLocaleString()}원` : "무료"}
        </div>
      </div>
    </Link>
  );
}
