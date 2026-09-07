import "./globals.css";
import { CartProvider } from "./CartProvider";
import Footer from "./Footer";

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
        <CartProvider>{children}</CartProvider>
        <Footer />
      </body>
    </html>
  );
}
