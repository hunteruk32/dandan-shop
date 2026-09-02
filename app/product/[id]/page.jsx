import Link from "next/link";
import { getProductById, getProducts, STATUS_STYLE } from "@/lib/sheet";

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

  return (
    <div className="wrap">
      <Link href="/" style={{ fontSize: 13, color: "var(--muted)" }}>← 목록으로</Link>

      <div style={{ marginTop: 12 }}>
        {product.image ? (
          <img className="detail-image" src={product.image} alt={product.name} />
        ) : (
          <div className="detail-image" />
        )}
      </div>

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted)" }}>{product.category}</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: "4px 0" }}>{product.name}</h1>
          <div className="price" style={{ fontSize: 18 }}>
            {product.price.toLocaleString()}원{product.options.length > 1 ? "부터" : ""}
          </div>
        </div>
        <span className="badge" style={{ background: s.bg, color: s.fg }}>{product.status}</span>
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

      <Link
        href={`/order/${product.id}`}
        className="btn"
        style={{ display: "block", textAlign: "center", marginTop: 24 }}
      >
        계좌이체로 주문하기
      </Link>

      <a
        href="https://open.kakao.com/o/pHvM5Eui"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "block", textAlign: "center", marginTop: 10, fontSize: 13, color: "var(--muted)" }}
      >
        카톡으로 먼저 문의하기
      </a>
    </div>
  );
}
