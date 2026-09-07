import Link from "next/link";
import { getProducts, getProductSalesCounts } from "@/lib/sheet";
import ProductBrowser from "./ProductBrowser";
import CartLink from "./CartLink";
import AuthStatus from "./AuthStatus";
import ProductAssetsLink from "./ProductAssetsLink";
import ChuseokNotice from "./ChuseokNotice";

export const revalidate = 60;

export default async function HomePage() {
  const [rawProducts, salesCounts] = await Promise.all([getProducts(), getProductSalesCounts()]);
  const products = rawProducts.map((p) => ({ ...p, salesCount: salesCounts[p.name] || 0 }));

  return (
    <div>
      <ChuseokNotice />
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">단단상회 주문 검색 · 상품리스트</h1>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginTop: 4 }}>
            최상의 제품을 최선의 가격으로
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <AuthStatus />
          <CartLink />
        </div>
      </header>

      <div className="wrap">
        <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link href="/reservations" className="btn" style={{ display: "inline-block" }}>
            🔍 내 주문 확인하기
          </Link>
          <ProductAssetsLink />
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
          🛍️ 현재 구매 가능 제품
        </h2>
        <ProductBrowser products={products} />
      </div>
    </div>
  );
}
