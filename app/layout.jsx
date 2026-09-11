import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
import { CartProvider } from "./CartProvider";
import Footer from "./Footer";
import PageviewTracker from "./PageviewTracker";

export const metadata = {
  metadataBase: new URL("https://dandan-shop.co.kr"),
  title: "단단상회 | 주문 검색 · 상품리스트",
  description: "단단상회 직거래 마켓 — 오늘의 상품과 주문 확인",
  openGraph: {
    title: "단단상회",
    description: "단단상회 직거래 마켓 — 오늘의 상품과 주문 확인",
    siteName: "단단상회",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {/* Google tag (gtag.js) — 단단상회 디맨드젠 캠페인 전환 추적 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-18369032939"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18369032939');
          `}
        </Script>
        <Suspense fallback={null}>
          <PageviewTracker />
        </Suspense>
        <CartProvider>{children}</CartProvider>
        <Footer />
      </body>
    </html>
  );
}
