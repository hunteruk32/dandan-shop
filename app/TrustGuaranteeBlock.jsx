const ITEMS = [
  {
    label: "콜드체인 2중 보냉포장",
    icon: <><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" /></>,
  },
  {
    label: "오전 7시 당일출고",
    icon: <><rect x="1" y="7" width="14" height="9" rx="1.5" /><path d="M15 10h4l3 3v3h-7z" /><circle cx="6" cy="19" r="1.6" /><circle cx="17.5" cy="19" r="1.6" /></>,
  },
  {
    label: "품질 하자 시 100% 교환·환불",
    icon: <><path d="M12 3 4.5 6v6c0 4.5 3.1 7.8 7.5 9 4.4-1.2 7.5-4.5 7.5-9V6Z" /><path d="m9 12 2 2 4-4" /></>,
  },
];

// 상품 상세에서 신선식품 구매의 불안 요소(포장·배송·품질)를 짧게 안내한다.
// 교환·환불 문구는 /guide, /terms에 실제로 안내된 조건(하자·오배송 시)과 같게 맞춘다 —
// "무조건 100% 교환·환불"처럼 약관과 안 맞는 과장된 문구로 바꾸지 않는다.
export default function TrustGuaranteeBlock() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 0,
        border: "1px solid var(--line)",
        borderRadius: 4,
        marginTop: 20,
        overflow: "hidden",
      }}
    >
      {ITEMS.map((it, i) => (
        <div
          key={it.label}
          style={{
            padding: "14px 6px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            textAlign: "center",
            borderLeft: i > 0 ? "1px solid var(--line)" : "none",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {it.icon}
          </svg>
          <span style={{ fontSize: 11.5, color: "var(--text)", lineHeight: 1.4 }}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}
