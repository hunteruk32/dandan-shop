import NavIcons from "../NavIcons";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8 }}>{title}</h2>
      <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </section>
  );
}

export default function GuidePage() {
  return (
    <div>
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">이용안내</h1>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <NavIcons />
        </div>
      </header>

      <div className="wrap">
        <Section title="1. 회원가입">
          <p>전화번호와 비밀번호만으로 간편하게 가입할 수 있어요. 회원가입은 주문(체크아웃) 시 한 번만 하면 되고, 이후에는 로그인만 하면 계속 이용할 수 있습니다.</p>
        </Section>

        <Section title="2. 주문 방법">
          <p>① 상품 목록에서 원하는 상품을 선택 → ② 옵션·수량 선택 후 "장바구니에 담기" 또는 "바로 주문하기" → ③ 로그인(최초 1회 회원가입) → ④ 발송인(주문자)·수취인 정보 입력 → ⑤ 주문 접수 후 안내되는 계좌로 입금.</p>
          <p>장바구니에는 여러 상품을 함께 담아 한 번에 주문할 수 있고, 선물용으로 발송인과 수취인을 다르게 지정할 수도 있어요.</p>
        </Section>

        <Section title="3. 결제 안내">
          <p>단단상회는 카드 결제 없이 <b style={{ color: "var(--ink)" }}>계좌이체</b>로만 주문을 받고 있어요. 주문 접수 후 안내되는 계좌로, 반드시 <b style={{ color: "var(--ink)" }}>발송인(주문자) 성함과 동일한 이름</b>으로 입금해주셔야 확인이 빠릅니다.</p>
          <p>입금 확인 전까지는 "내 주문 확인"에서 수취인 정보와 요청사항(비고)을 직접 수정할 수 있어요.</p>
        </Section>

        <Section title="4. 배송 안내">
          <p>입금 확인 후 순차적으로 발송됩니다. 산지 직송 특성상 상품별로 발송 소요일이 다를 수 있고, 신선도 유지를 위해 냉장·냉동 포장으로 발송돼요.</p>
          <p>도서·산간 등 일부 지역은 추가 배송비가 발생할 수 있습니다. 발송이 시작되면 "내 주문 확인"에서 택배사와 송장번호를 바로 확인할 수 있어요.</p>
        </Section>

        <Section title="5. 교환·반품 안내">
          <p>신선 농수산물 특성상 <b style={{ color: "var(--ink)" }}>단순 변심에 의한 교환·반품은 제한</b>될 수 있어요(전자상거래법상 신선식품 등 재화 특성에 따른 청약철회 제한).</p>
          <p>다만 상품 하자, 오배송, 파손·불량 등 저희 측 과실이 있는 경우에는 <b style={{ color: "var(--ink)" }}>수령 후 24시간 이내</b> 사진과 함께 카카오톡 또는 전화로 알려주시면 확인 후 재발송 또는 환불로 처리해드립니다.</p>
        </Section>

        <Section title="6. 환불 안내">
          <p>환불이 확정되면 영업일 기준 3일 이내에 입금하셨던 계좌로 환불해드립니다. 입금 전 취소는 "내 주문 확인"에서 확인 후 고객센터로 연락해주세요.</p>
        </Section>

        <Section title="문의">
          <p>그 밖에 궁금한 점은 <a href="https://open.kakao.com/o/pHvM5Eui" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", fontWeight: 700 }}>카카오톡</a> 또는 전화(070-8058-8287, 평일 10:00-17:00)로 편하게 문의해주세요.</p>
        </Section>
      </div>
    </div>
  );
}
