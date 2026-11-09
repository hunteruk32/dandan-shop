import Link from "next/link";
import TrustBadges from "./TrustBadges";

export default function Footer() {
  return (
    <footer style={{ marginTop: 40, padding: "22px 16px 32px", borderTop: "1px solid var(--line)", background: "#fff" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "var(--muted)", lineHeight: 1.6, textAlign: "center" }}>
        <div style={{ marginBottom: 4 }}>
          <TrustBadges />
        </div>
        <div>
          월요일-금요일 10:00-17:00 (점심시간 12:00-13:00) &nbsp; 전화 070-8058-8287 &nbsp; 주소 02233 서울 중랑구 겸재로10길 44 면목 루브루 401호
        </div>
        <div>
          상호 더블에스글로벌 &nbsp; 대표 성욱진 &nbsp; 사업자등록번호 466-01-03524 &nbsp; 통신판매업신고번호 2024-서울중랑-1185호 &nbsp; 이메일 contact@dandan-shop.co.kr
        </div>
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 10, marginTop: 8, fontSize: 12, fontWeight: 700 }}>
          <Link href="/contact" style={{ color: "var(--ink)" }}>문의</Link>
          <span>|</span>
          <Link href="/guide" style={{ color: "var(--ink)" }}>이용안내</Link>
          <span>|</span>
          <Link href="/terms" style={{ color: "var(--ink)" }}>이용약관</Link>
          <span>|</span>
          <Link href="/privacy" style={{ color: "var(--ink)" }}>개인정보처리방침</Link>
        </div>
        <div style={{ marginTop: 10 }}>
          <Link href="/admin" aria-label="관리자" title="관리자" style={{ color: "var(--muted)", fontSize: 15 }}>⚙</Link>
        </div>
      </div>
    </footer>
  );
}
