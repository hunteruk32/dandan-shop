import "./globals.css";

export const metadata = {
  title: "단단상회 | 주문 검색 · 상품리스트",
  description: "단단상회 직거래 마켓 — 오늘의 상품과 예약 확인",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
