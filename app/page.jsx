import Link from "next/link";
import { Suspense } from "react";
import { getProducts, getProductSalesCounts, CATEGORIES } from "@/lib/sheet";
import ProductBrowser from "./ProductBrowser";
import CartLink from "./CartLink";
import AuthStatus from "./AuthStatus";
import ProductAssetsLink from "./ProductAssetsLink";
import ChuseokNotice from "./ChuseokNotice";
import OpenChatBanner from "./OpenChatBanner";
import CategoryQuickGrid from "./CategoryQuickGrid";
import BestProducts from "./BestProducts";
import TrustStrip from "./TrustStrip";
import StatsBanner from "./StatsBanner";
import TrustBadges from "./TrustBadges";

export const revalidate = 60;

export default async function HomePage() {
  const [rawProducts, salesCounts] = await Promise.all([getProducts(), getProductSalesCounts()]);
  const products = rawProducts.map((p) => ({ ...p, salesCount: salesCounts[p.name] || 0 }));
  const presentCategories = CATEGORIES.filter((c) => products.some((p) => p.category === c));

  return (
    <div>
      <ChuseokNotice />

      <div className="site-header">
        <div className="site-header-bar">
          <div className="seal" style={{ width: 44, height: 44 }}>
            <img src="/brand-icon.png" alt="단단상회" />
          </div>
          <div>
            <div className="eyebrow" style={{ color: "var(--spice)" }}>DIRECT TRADE MARKET</div>
            <div className="serif" style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)" }}>단단상회</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <AuthStatus dark={false} />
            <CartLink dark={false} />
          </div>
        </div>
        <nav className="site-nav">
          <Link href="/">전체 카테고리</Link>
          {presentCategories.map((c) => (
            <Link key={c} href={`/?category=${encodeURIComponent(c)}#products`}>{c}</Link>
          ))}
          <Link href="/reservations" style={{ marginLeft: "auto", color: "var(--muted)" }}>내 주문 확인</Link>
        </nav>
      </div>

      <div className="hero">
        <div className="hero-inner">
          <div style={{ flex: 1 }}>
            <div className="hero-eyebrow">산지 직송 도소매</div>
            <h1 className="hero-title serif">
              산지에서 식탁까지,<br />중간 유통 없이 하루 만에
            </h1>
            <p className="hero-desc">
              최상의 제품을 최선의 가격으로. 전국 산지 협력 농가·어가에서 그날그날 들어온 물건만
              엄선해 도매가에 가까운 가격으로 직접 보내드립니다.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="#products" className="btn" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                오늘의 산지 물건 보기
              </a>
              <Link href="/reservations" className="btn" style={{ background: "transparent", border: "1.5px solid #55604F", color: "var(--bg)" }}>
                내 주문 확인하기
              </Link>
            </div>
          </div>
        </div>
        <TrustStrip />
      </div>

      <div className="wrap">
        <div style={{ margin: "20px 0" }}>
          <OpenChatBanner />
        </div>

        {presentCategories.length > 0 ? (
          <div style={{ marginBottom: 8 }}>
            <div className="section-head">
              <h2 className="section-title">카테고리별 둘러보기</h2>
            </div>
            <CategoryQuickGrid categories={presentCategories} />
          </div>
        ) : null}

        <BestProducts products={products} />

        <div id="products" style={{ marginTop: 40, scrollMarginTop: 90 }}>
          <div className="section-head">
            <h2 className="section-title">지금 구매 가능한 상품</h2>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>전체 {products.length}개 상품</div>
          </div>
          <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
            <TrustBadges align="left" />
            <ProductAssetsLink />
          </div>
          <Suspense fallback={null}>
            <ProductBrowser products={products} />
          </Suspense>
        </div>

        <div style={{ marginTop: 44 }}>
          <StatsBanner productCount={products.length} categoryCount={presentCategories.length} />
        </div>
      </div>
    </div>
  );
}
