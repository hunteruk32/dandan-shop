import Link from "next/link";
import { getProducts } from "@/lib/sheet";
import ProductBrowser from "./ProductBrowser";
import CartLink from "./CartLink";
import AuthStatus from "./AuthStatus";

export const revalidate = 60;

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div>
      <header className="header">
        <div className="seal">단단</div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">단단상회 주문 검색 · 상품리스트</h1>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <AuthStatus />
          <CartLink />
        </div>
      </header>

      <div className="wrap">
        <div style={{ marginBottom: 20 }}>
          <Link href="/reservations" className="btn" style={{ display: "inline-block" }}>
            🔍 내 주문 확인하기
          </Link>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
          🛍️ 현재 구매 가능 제품
        </h2>
        <ProductBrowser products={products} />
      </div>
    </div>
  );
}
