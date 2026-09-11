const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "5px 10px",
  borderRadius: 999,
  border: "1px solid var(--line)",
  background: "#f6f8f6",
  fontSize: 11.5,
  fontWeight: 700,
  color: "var(--ink)",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

export default function TrustBadges({ align = "center" }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        justifyContent: align === "center" ? "center" : "flex-start",
      }}
    >
      <a
        href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=4660103524"
        target="_blank"
        rel="noopener noreferrer"
        style={badgeStyle}
        title="공정거래위원회에서 사업자등록 정보를 직접 확인할 수 있습니다"
      >
        ✅ 사업자정보확인
      </a>
      <span style={badgeStyle} title="통신판매업 신고번호: 2024-서울중랑-1185호">
        📋 통신판매업 신고완료
      </span>
    </div>
  );
}
