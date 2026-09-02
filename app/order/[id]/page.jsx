import Link from "next/link";
import { getProductById } from "@/lib/sheet";
import OrderForm from "./OrderForm";

export const revalidate = 60;

export default async function OrderPage({ params }) {
  const product = await getProductById(params.id);

  if (!product) {
    return (
      <div className="wrap">
        <p style={{ marginTop: 40 }}>상품을 찾을 수 없어요.</p>
        <Link href="/" className="btn" style={{ display: "inline-block", marginTop: 12 }}>목록으로</Link>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="seal">단단</div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">주문하기</h1>
        </div>
      </header>
      <div className="wrap">
        <Link href={`/product/${product.id}`} style={{ fontSize: 13, color: "var(--muted)" }}>← 상품으로</Link>
        <div style={{ marginTop: 14 }}>
          <OrderForm product={product} />
        </div>
      </div>
    </div>
  );
}
