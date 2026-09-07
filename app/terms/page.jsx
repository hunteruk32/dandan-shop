import NavIcons from "../NavIcons";

function Article({ title, children }) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{title}</h2>
      <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--muted)", display: "flex", flexDirection: "column", gap: 4 }}>
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div>
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">이용약관</h1>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <NavIcons />
        </div>
      </header>

      <div className="wrap">
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>시행일: 2026년 9월 7일</p>

        <Article title="제1조 (목적)">
          <p>이 약관은 더블에스글로벌(이하 "회사")이 운영하는 단단상회(이하 "몰")에서 제공하는 상품 판매·구매와 관련한 회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.</p>
        </Article>

        <Article title="제2조 (정의)">
          <p>① "몰"이란 회사가 상품을 이용자에게 제공하기 위해 운영하는 웹사이트를 말합니다.</p>
          <p>② "이용자"란 몰에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
          <p>③ "회원"이란 몰에 전화번호와 비밀번호로 회원가입을 한 자로서, 몰의 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</p>
        </Article>

        <Article title="제3조 (약관의 명시와 개정)">
          <p>① 회사는 이 약관의 내용을 이용자가 알 수 있도록 몰 화면 또는 그 연결화면에 게시합니다.</p>
          <p>② 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정 시 적용일자 및 개정 사유를 명시하여 적용일자 7일 전(이용자에게 불리한 경우 30일 전)부터 몰에 공지합니다.</p>
        </Article>

        <Article title="제4조 (서비스의 제공 및 변경)">
          <p>회사는 상품 정보 제공, 구매계약 체결, 결제 및 배송 등의 서비스를 제공하며, 상품의 품절 또는 사양 변경 등의 사유로 서비스 내용을 변경할 수 있습니다.</p>
        </Article>

        <Article title="제5조 (서비스의 중단)">
          <p>회사는 시스템 점검, 교체, 고장 또는 통신 두절 등의 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있습니다.</p>
        </Article>

        <Article title="제6조 (회원가입)">
          <p>이용자는 회사가 정한 가입 양식에 따라 전화번호와 비밀번호를 등록함으로써 회원가입을 신청하며, 회사는 이에 대해 회원으로 등록합니다.</p>
        </Article>

        <Article title="제7조 (회원 탈퇴 및 자격 상실)">
          <p>회원은 언제든지 고객센터를 통해 탈퇴를 요청할 수 있습니다. 회원이 허위 정보를 등록하거나 타인의 정보를 도용한 경우 회사는 회원자격을 제한하거나 상실시킬 수 있습니다.</p>
        </Article>

        <Article title="제8조 (구매신청 및 계약의 성립)">
          <p>① 이용자는 몰에서 상품을 선택하고 발송인·수취인 정보를 입력하여 구매를 신청합니다.</p>
          <p>② 계약은 회사가 이용자의 구매신청에 대해 주문 접수(계좌 안내) 확인을 발송한 시점에 성립합니다.</p>
        </Article>

        <Article title="제9조 (결제 방법)">
          <p>몰에서 상품 구매 시 결제 방법은 계좌이체(무통장입금)로 하며, 입금자명은 발송인(주문자) 성함과 동일하게 입력해야 합니다.</p>
        </Article>

        <Article title="제10조 (배송)">
          <p>① 회사는 이용자가 입금을 완료한 상품에 대해 배송수단, 수령인 등을 확인하여 신속하게 배송조치를 합니다.</p>
          <p>② 신선 농수산물의 특성상 산지 사정에 따라 발송일이 상품별로 달라질 수 있으며, 도서·산간지역은 추가 배송비가 발생할 수 있습니다.</p>
        </Article>

        <Article title="제11조 (청약철회 등)">
          <p>① 이용자는 배송받은 상품에 대해 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 청약철회를 할 수 있습니다.</p>
          <p>② 다만 신선 농수산물 등 시간의 경과에 의해 재판매가 곤란하거나 가치가 현저히 감소하는 재화의 경우, 단순 변심에 의한 청약철회는 제한될 수 있습니다.</p>
          <p>③ 상품 하자, 오배송 등 회사의 귀책사유가 있는 경우에는 수령일로부터 상당한 기간 내에 교환·반품·환불을 요청할 수 있습니다.</p>
        </Article>

        <Article title="제12조 (환불)">
          <p>회사는 환불 사유가 확인된 경우 영업일 기준 3일 이내에 이용자가 입금했던 계좌로 환불합니다.</p>
        </Article>

        <Article title="제13조 (개인정보보호)">
          <p>회사는 이용자의 개인정보를 보호하기 위해 관련 법령이 정하는 바를 준수하며, 자세한 사항은 별도의 개인정보처리방침에 따릅니다.</p>
        </Article>

        <Article title="제14조 (회사의 의무)">
          <p>회사는 관련 법령과 이 약관이 금지하는 행위를 하지 않으며, 지속적·안정적인 서비스 제공을 위해 노력합니다.</p>
        </Article>

        <Article title="제15조 (이용자의 의무)">
          <p>이용자는 신청 또는 변경 시 허위 내용을 등록하지 않아야 하며, 회사가 게시한 정보를 임의로 변경하거나 회사 및 제3자의 저작권 등 지식재산권을 침해해서는 안 됩니다.</p>
        </Article>

        <Article title="제16조 (분쟁해결)">
          <p>회사와 이용자 간에 발생한 분쟁에 대해서는 관련 법령에 따르며, 소송이 제기될 경우 민사소송법상의 관할 법원에 제기합니다.</p>
        </Article>

        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 24 }}>
          문의: 더블에스글로벌 · contact@dandan-shop.kr · 070-8058-8287
        </p>
      </div>
    </div>
  );
}
