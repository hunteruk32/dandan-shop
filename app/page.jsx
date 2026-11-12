import { Suspense } from "react";
import { getProducts, getProductSalesCounts, CATEGORIES, SUPPLIERS } from "@/lib/sheet";
import { toPublicProduct } from "@/lib/publicProduct";
import { getRecentPublicReviews } from "@/lib/reviews";
import ProductBrowser from "./ProductBrowser";
import ProductAssetsLink from "./ProductAssetsLink";
import HolidayNotice from "./HolidayNotice";
import CardPaymentNotice from "./CardPaymentNotice";
import RewardPointsNotice from "./RewardPointsNotice";
import FirstOrderBonusNotice from "./FirstOrderBonusNotice";
import SiteHeader from "./SiteHeader";
import OpenChatBanner from "./OpenChatBanner";
import CategoryQuickGrid from "./CategoryQuickGrid";
import BestProducts from "./BestProducts";
import MdPicks from "./MdPicks";
import TrustStrip from "./TrustStrip";
import StatsBanner from "./StatsBanner";
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
  // 시즌종료 상품은 구매가 안 되니 홈페이지 목록에서 아예 뺀다(상품 상세 직접 링크는
  // 그대로 접근 가능하게 둬서 기존 북마크·검색 결과는 안 깨지게 한다).
  const products = rawProducts
    .filter((p) => p.status !== "등록대기" && p.status !== "시즌종료")
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
      <FirstOrderBonusNotice />

      <SiteHeader presentCategories={presentCategories} />

      <div className="hero hero-compact">
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
              <p className="hero-tagline">산지에서 식탁까지, 중간 유통 없이 하루 만에</p>
              <a href="#products" className="btn" style={{ background: "var(--gold)", color: "var(--ink)" }}>
                오늘의 산지 물건 보기
              </a>
            </div>
          </div>
        </div>
        <TrustStrip />
      </div>

      <div className="wrap">
        {presentCategories.length > 0 ? (
          <div style={{ marginTop: 16, marginBottom: 8 }}>
            <div className="section-head">
              <h2 className="section-title">카테고리별 둘러보기</h2>
            </div>
            <CategoryQuickGrid categories={presentCategories} />
          </div>
        ) : null}

        <BestProducts products={products} />

        <div style={{ margin: "24px 0" }}>
          <OpenChatBanner />
        </div>

        <div style={{ marginBottom: 20 }}>
          <RealtimeReviewTicker reviews={recentReviews} />
        </div>

        <MdPicks products={products} />

        <div id="products" style={{ marginTop: 40, scrollMarginTop: 90 }}>
          <div className="section-head">
            <h2 className="section-title">지금 구매 가능한 상품</h2>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>전체 {products.length}개 상품</div>
          </div>
          <div style={{ marginBottom: 14 }}>
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
