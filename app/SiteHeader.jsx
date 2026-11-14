import Link from "next/link";
import { getProducts, CATEGORIES } from "@/lib/sheet";
import CartLink from "./CartLink";
import AuthStatus from "./AuthStatus";
import HeaderSearch from "./HeaderSearch";

async function getDefaultCategories() {
  const products = await getProducts();
  return CATEGORIES.filter((c) => products.some((p) => p.category === c));
}

// 사이트 전체에서 공통으로 쓰는 상단 헤더(로고+카테고리 내비+로그인/장바구니).
// 홈페이지처럼 이미 상품 목록을 갖고 있는 페이지는 presentCategories를 넘겨서
// 구글시트를 두 번 읽지 않게 하고, 그 외 페이지는 이 컴포넌트가 알아서 가져온다.
export default async function SiteHeader({ presentCategories }) {
  const categories = presentCategories ?? (await getDefaultCategories());

  return (
    <div className="site-header">
      <div className="site-top-banner">
        오전 7시 이전 주문 시 당일 산지 발송 · 중간 유통 마진 0원
      </div>
      <div className="site-header-bar">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="seal" style={{ width: 38, height: 38 }}>
            <img src="/brand-icon.png" alt="단단상회" />
          </div>
          <div className="serif" style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>단단상회</div>
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <AuthStatus dark={false} />
          <CartLink dark={false} />
        </div>
      </div>
      <div className="site-header-search" style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <HeaderSearch />
        </div>
        <Link href="/reservations" className="mobile-only" style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", flexShrink: 0 }}>
          주문확인
        </Link>
      </div>
      <nav className="site-nav">
        <Link href="/">전체 카테고리</Link>
        {categories.map((c) => (
          <Link key={c} href={`/?category=${encodeURIComponent(c)}#products`}>{c}</Link>
        ))}
        <Link href="/reservations" style={{ marginLeft: "auto", color: "var(--muted)" }}>내 주문 확인</Link>
      </nav>
    </div>
  );
}
