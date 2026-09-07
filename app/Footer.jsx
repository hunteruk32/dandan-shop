import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ marginTop: 40, padding: "22px 16px 32px", borderTop: "1px solid var(--line)", background: "#fff" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "var(--muted)", lineHeight: 1.6, textAlign: "center" }}>
        <div>
          월요일-금요일 10:00-17:00 (Lunch 12:00-13:00) &nbsp; Tel 070-8058-8287 &nbsp; Address: 02233 서울 중랑구 겸재로10길 44 면목 루브루 401호
        </div>
        <div>
          Company 더블에스글로벌 &nbsp; Owner 성욱진 &nbsp; Business No 466-01-03524 &nbsp; Online-Order No 2024-서울중랑-1185호 &nbsp; Email. contact@dandan-shop.co.kr
        </div>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 8, fontSize: 12, fontWeight: 700 }}>
          <Link href="/contact" style={{ color: "var(--ink)" }}>Contact</Link>
          <span>|</span>
          <Link href="/guide" style={{ color: "var(--ink)" }}>Guide</Link>
          <span>|</span>
          <Link href="/terms" style={{ color: "var(--ink)" }}>Terms of Use</Link>
          <span>|</span>
          <Link href="/privacy" style={{ color: "var(--ink)" }}>Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
