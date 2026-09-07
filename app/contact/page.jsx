import NavIcons from "../NavIcons";

export default function ContactPage() {
  return (
    <div>
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">Contact</h1>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <NavIcons />
        </div>
      </header>

      <div className="wrap" style={{ fontSize: 14, lineHeight: 1.8 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>고객센터</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
          <div>운영시간: 월요일-금요일 10:00-17:00 (Lunch 12:00-13:00, 토·일·공휴일 휴무)</div>
          <div>전화: 070-8058-8287</div>
          <div>이메일: contact@dandan-shop.co.kr</div>
          <div>주소: 02233 서울 중랑구 겸재로10길 44 면목 루브루 401호</div>
        </div>

        <a
          href="https://open.kakao.com/o/pHvM5Eui"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ display: "inline-block", marginBottom: 28 }}
        >
          카카오톡으로 문의하기
        </a>

        <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>사업자 정보</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--muted)", fontSize: 13 }}>
          <div>상호: 더블에스글로벌</div>
          <div>대표자: 성욱진</div>
          <div>사업자등록번호: 466-01-03524</div>
          <div>통신판매업신고: 제2024-서울중랑-1185호</div>
        </div>
      </div>
    </div>
  );
}
