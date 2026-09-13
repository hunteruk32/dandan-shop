import NavIcons from "./NavIcons";

// 서브페이지 상단에 쓰는 "제목 + 뒤로가기/홈" 줄. 전체 사이트 헤더(SiteHeader)와 별개로,
// 각 페이지의 .wrap 안쪽 맨 위에 넣어서 쓴다.
export default function PageTitleRow({ title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <h1 className="serif" style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h1>
      <NavIcons dark={false} />
    </div>
  );
}
