const OPENCHAT_URL = "https://open.kakao.com/o/pHvM5Eui";

// 본문에 있던 오픈톡 배너를 우측 하단 플로팅 버튼으로 뺀다. liftBottom은 그 페이지에
// 이미 화면 하단에 고정된 다른 바(예: 상품 상세의 StickyBuyBar)가 있을 때, 거기 안
// 가리게 위로 띄우는 값이다.
export default function OpenChatFab({ liftBottom = 0 }) {
  return (
    <a
      href={OPENCHAT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="오픈채팅방 바로가기"
      style={{
        position: "fixed",
        right: "max(16px, env(safe-area-inset-right, 0px))",
        bottom: `calc(${16 + liftBottom}px + env(safe-area-inset-bottom, 0px))`,
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        gap: 8,
        height: 44,
        padding: "0 16px",
        borderRadius: 4,
        background: "var(--ink)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 700,
        boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.5 7 0 0 1-8.9 7 9.3 9.3 0 0 1-2.4-.3L5 20l1-3.8A6.9 6.9 0 0 1 3.5 11.5a8.5 7 0 0 1 8.9-7 8.5 7 0 0 1 8.6 7Z" />
      </svg>
      오픈톡 문의
    </a>
  );
}
