import Link from "next/link";
import { getProductById, getProducts, STATUS_STYLE } from "@/lib/sheet";
import CartLink from "../../CartLink";
import NavIcons from "../../NavIcons";
import ProductOrderPanel from "./ProductOrderPanel";
import ZoomableImage from "./ZoomableImage";
import StickyBuyBar from "./StickyBuyBar";
import ProductTestimonials from "./ProductTestimonials";
import { getDiscount } from "@/lib/pricing";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ id: p.id }));
}

export default async function ProductPage({ params }) {
  const product = await getProductById(params.id);

  if (!product) {
    return (
      <div className="wrap">
        <p style={{ marginTop: 40 }}>상품을 찾을 수 없어요.</p>
        <Link href="/" className="btn" style={{ display: "inline-block", marginTop: 12 }}>
          목록으로
        </Link>
      </div>
    );
  }

  const s = STATUS_STYLE[product.status] || STATUS_STYLE["주문가능"];
  const discount = getDiscount(product.listPrice, product.price);

  return (
    <div className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <NavIcons dark={false} />
        <CartLink dark={false} />
      </div>

      <div style={{ marginTop: 12 }}>
        {product.image ? (
          <ZoomableImage className="detail-image" src={product.image} alt={product.name} />
        ) : (
          <div className="detail-image" />
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{product.category}</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0" }}>{product.name}</h1>
          {discount ? (
            <div style={{ fontSize: 13, color: "var(--muted)", textDecoration: "line-through" }}>
              {discount.listPrice.toLocaleString()}원
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {discount ? <span style={{ fontWeight: 800, fontSize: 16, color: "var(--spice)" }}>{discount.rate}%</span> : null}
            <div className="price" style={{ fontSize: 18 }}>
              {product.price.toLocaleString()}원{product.options.length > 1 ? "부터" : ""}
            </div>
          </div>
        </div>
        <span className="badge" style={{ background: s.bg, color: s.fg }}>{product.status}</span>
      </div>

      <ProductTestimonials product={product} />

      <div id="quick-order">
        <ProductOrderPanel product={product} />
      </div>

      {product.options.length > 0 && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
          {product.options.map((o, i) => (
            <div
              key={i}
              className="card"
              style={{ justifyContent: "space-between", padding: "10px 14px" }}
            >
              <span style={{ fontSize: 13 }}>{o.name}</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{o.price.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      )}

      {product.description && (
        <div
          className="desc"
          dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, "<br>") }}
        />
      )}

      {product.detailImage && (
        <ZoomableImage
          src={product.detailImage}
          alt={`${product.name} 상세설명`}
          style={{ width: "100%", display: "block", marginTop: 16, borderRadius: 12 }}
        />
      )}

      <div id="bottom-order">
        <ProductOrderPanel product={product} />

        <a
          href="https://open.kakao.com/o/pHvM5Eui"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            marginTop: 12,
            padding: "12px 18px",
            borderRadius: 10,
            background: "#FEE500",
            color: "#191600",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          💬 카카오톡으로 먼저 문의하기
        </a>
      </div>

      <StickyBuyBar
        productName={product.name}
        price={product.price}
        listPrice={product.listPrice}
        hasOptions={product.options.length > 1}
      />
    </div>
  );
}
