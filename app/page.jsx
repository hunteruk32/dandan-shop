import Link from "next/link";
import { Suspense } from "react";
import { getProducts, getProductSalesCounts, CATEGORIES, SUPPLIERS } from "@/lib/sheet";
import { toPublicProduct } from "@/lib/publicProduct";
import { getRecentPublicReviews } from "@/lib/reviews";
import ProductBrowser from "./ProductBrowser";
import ProductAssetsLink from "./ProductAssetsLink";
import HolidayNotice from "./HolidayNotice";
import CardPaymentNotice from "./CardPaymentNotice";
import RewardPointsNotice from "./RewardPointsNotice";
import SiteHeader from "./SiteHeader";
import OpenChatBanner from "./OpenChatBanner";
import CategoryQuickGrid from "./CategoryQuickGrid";
import BestProducts from "./BestProducts";
import MdPicks from "./MdPicks";
import TrustStrip from "./TrustStrip";
import StatsBanner from "./StatsBanner";
import TrustBadges from "./TrustBadges";
import RealtimeReviewTicker from "./RealtimeReviewTicker";

export const revalidate = 60;

export const metadata = {
  title: "단단상회 | 산지직송 수산물·과일·김치 도매가 직거래",
  description:
    "전국 협력 산지에서 수산물·과일·김치를 중간 유통 없이 도매가에 직접 보내드립니다. 오전 7시 주문 마감, 당일 발송.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "단단상회 | 산지직송 수산물·과일·김치 도매가 직거래",
    description:
      "전국 협력 산지에서 수산물·과일·김치를 중간 유통 없이 도매가에 직접 보내드립니다. 오전 7시 주문 마감, 당일 발송.",
    siteName: "단단상회",
  },
};

const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "단단상회",
  legalName: "더블에스글로벌",
  url: "https://www.dandan-shop.co.kr",
  email: "contact@dandan-shop.co.kr",
  telephone: "070-8058-8287",
  address: {
    "@type": "PostalAddress",
    streetAddress: "겸재로10길 44 면목 루브루 401호",
    addressLocality: "중랑구",
    addressRegion: "서울",
    postalCode: "02233",
    addressCountry: "KR",
  },
};

export default async function HomePage() {
  const [rawProducts, salesCounts, recentReviews] = await Promise.all([
    getProducts(),
    getProductSalesCounts(),
    getRecentPublicReviews(24).catch(() => []),
  ]);
  // 목록 RSC payload도 손님용 객체만 담는다. 설명은 카드에서 안 쓰므로 비운다.
  const products = rawProducts
    .filter((p) => p.status !== "등록대기")
    .map((p) => ({
      ...toPublicProduct(p, SUPPLIERS),
      description: "",
      salesCount: salesCounts[p.name] || 0,
    }));
  const presentCategories = CATEGORIES.filter((c) => products.some((p) => p.category === c));

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSON_LD) }}
      />
      <HolidayNotice />
      <CardPaymentNotice />
      <RewardPointsNotice />

      <SiteHeader presentCategories={presentCategories} />

      <div className="hero">
        <div className="hero-media">
          <video
            className="hero-video"
            src="/hero/dandan-hero.mp4"
            poster="/hero/dandan-hero-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <div className="hero-scrim" />
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
        </div>
        <TrustStrip />
      </div>

      <div className="wrap">
        <div style={{ margin: "20px 0" }}>
          <OpenChatBanner />
        </div>

        <div style={{ marginBottom: 20 }}>
          <RealtimeReviewTicker reviews={recentReviews} />
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

        <MdPicks products={products} />

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
