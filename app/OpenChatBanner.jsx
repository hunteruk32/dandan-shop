const OPENCHAT_URL = "https://open.kakao.com/o/pHvM5Eui";

export default function OpenChatBanner() {
  return (
    <a href={OPENCHAT_URL} target="_blank" rel="noopener noreferrer" className="opentalk-banner">
      <div>
        <div className="opentalk-banner-title">오픈채팅방에서 가격 변동 · 신규 상품 소식을 가장 빠르게 받아보세요</div>
        <div className="opentalk-banner-desc">사이트 반영보다 빠른 실시간 공지 · 산지 시세 변동 · 한정 수량 알림</div>
      </div>
      <div className="opentalk-banner-cta">오픈톡방 바로가기 →</div>
    </a>
  );
}
