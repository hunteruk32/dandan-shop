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

export default function PrivacyPage() {
  return (
    <div>
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">개인정보처리방침</h1>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <NavIcons />
        </div>
      </header>

      <div className="wrap">
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>시행일: 2026년 9월 7일</p>
        <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--muted)", marginBottom: 20 }}>
          더블에스글로벌(이하 "회사")이 운영하는 단단상회(이하 "몰")는 이용자의 개인정보를 중요시하며,
          「개인정보 보호법」 등 관련 법령을 준수하고 있습니다. 회사는 개인정보처리방침을 통해 이용자가
          제공하는 개인정보가 어떤 목적과 방식으로 이용되고 있으며, 개인정보보호를 위해 어떤 조치가
          취해지고 있는지 알려드립니다.
        </p>

        <Article title="1. 개인정보의 처리 목적">
          <p>회사는 회원가입 및 관리, 상품 주문·결제·배송, 고객 상담 및 불만 처리를 위한 목적으로 개인정보를 처리합니다.</p>
        </Article>

        <Article title="2. 개인정보의 처리 및 보유 기간">
          <p>① 회원 정보는 회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.</p>
          <p>② 주문·결제 기록은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 계약 또는 청약철회 등에 관한 기록 5년, 대금결제 및 재화 공급에 관한 기록 5년, 소비자 불만 또는 분쟁처리에 관한 기록 3년간 보관합니다.</p>
        </Article>

        <Article title="3. 처리하는 개인정보 항목">
          <p>① 회원가입: 전화번호, 비밀번호</p>
          <p>② 주문·배송: 발송인(주문자) 성함·주소·전화번호, 수취인 성함·주소·전화번호</p>
          <p>③ 서비스 이용 과정에서 접속 로그, 이용기록 등이 생성되어 수집될 수 있습니다.</p>
        </Article>

        <Article title="4. 개인정보의 제3자 제공">
          <p>회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 상품 배송을 위해 필요한 최소한의 정보(수취인 성함·주소·전화번호)를 배송을 위탁받은 택배업체에 제공할 수 있습니다.</p>
        </Article>

        <Article title="5. 개인정보처리의 위탁">
          <p>회사는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리업무를 위탁하고 있으며, 위탁계약 시 개인정보가 안전하게 관리될 수 있도록 필요한 사항을 규정합니다.</p>
          <p>- 상품 배송: 계약 택배사</p>
          <p>- 웹사이트 호스팅 및 운영: Vercel Inc.</p>
        </Article>

        <Article title="6. 만 14세 미만 아동의 개인정보">
          <p>몰은 만 14세 미만 아동을 대상으로 서비스를 제공하지 않으며, 만 14세 미만 아동의 개인정보를 수집하지 않는 것을 원칙으로 합니다.</p>
        </Article>

        <Article title="7. 개인정보의 파기">
          <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 복구 불가능한 방법으로 영구 삭제하며, 종이 문서는 분쇄하거나 소각합니다.</p>
        </Article>

        <Article title="8. 정보주체의 권리·의무 및 행사방법">
          <p>이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회·수정하거나 가입 해지(회원 탈퇴)를 요청할 수 있으며, 고객센터를 통해 서면, 전화, 이메일로 연락하시면 지체 없이 조치합니다.</p>
        </Article>

        <Article title="9. 개인정보의 안전성 확보조치">
          <p>회사는 개인정보의 안전성 확보를 위해 비밀번호 암호화, 접근권한 관리, 접속기록 보관 등의 기술적·관리적 조치를 취하고 있습니다.</p>
        </Article>

        <Article title="10. 개인정보 보호책임자">
          <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
          <p>- 성명: 성욱진 (대표)</p>
          <p>- 이메일: contact@dandan-shop.kr</p>
          <p>- 전화: 070-8058-8287 (평일 10:00-17:00, Lunch 12:00-13:00)</p>
        </Article>

        <Article title="11. 개인정보처리방침의 변경">
          <p>이 개인정보처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는 시행 최소 7일 전에 몰을 통해 고지할 것입니다.</p>
        </Article>
      </div>
    </div>
  );
}
