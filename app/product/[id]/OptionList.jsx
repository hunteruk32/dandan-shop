import { getDiscount } from "@/lib/pricing";

// 옵션 이름 앞의 "대A", "소B" 같은 크기+등급 표기를 읽는다.
const GRADE_RE = /^(대|소)([A-Z])(?![A-Za-z])/;

const SIZE_COLOR = { 대: "#1d4ed8", 소: "#db2777" };
const GRADE_COLOR = { A: "#2f6e4f", B: "#a0611f" };
const WEIGHT_COLOR = "#7c3aed";
const SIZE_DESC = { 대: "큰 사이즈", 소: "작은 사이즈" };

function gradeColor(g) {
  return GRADE_COLOR[g] || "#555";
}

// 크기(대/소)·등급(A/B)·무게(kg)를 색으로 구분해서 보여준다.
function OptionName({ name }) {
  const m = name.match(/^(?:(대|소)([A-Z])(?![A-Za-z]))?(\s*)(.*?)(\d+(?:\.\d+)?\s*kg)(.*)$/i);
  if (!m) return <span style={{ fontSize: 13 }}>{name}</span>;
  const [, size, grade, sp, before, weight, rest] = m;
  return (
    <span style={{ fontSize: 13 }}>
      {size ? <b style={{ color: SIZE_COLOR[size] }}>{size}</b> : null}
      {grade ? <b style={{ color: gradeColor(grade) }}>{grade}</b> : null}
      {sp}
      {before}
      <b style={{ color: WEIGHT_COLOR }}>{weight}</b>
      {rest}
    </span>
  );
}

function OptionRow({ o }) {
  const d = getDiscount(o.listPrice, o.price);
  return (
    <div className="card" style={{ justifyContent: "space-between", padding: "10px 14px" }}>
      <OptionName name={o.name} />
      <span style={{ display: "flex", alignItems: "baseline", gap: 6, flexShrink: 0 }}>
        {d ? (
          <span style={{ fontSize: 11, color: "var(--muted)", textDecoration: "line-through" }}>
            {d.listPrice.toLocaleString()}원
          </span>
        ) : null}
        {d ? <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>{d.rate}%</span> : null}
        <span style={{ fontWeight: 700, fontSize: 14 }}>{o.price.toLocaleString()}원</span>
      </span>
    </div>
  );
}

const rowsStyle = { display: "flex", flexDirection: "column", gap: 6 };

function Chip({ children, color }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 800,
        padding: "2px 9px",
        borderRadius: 4,
        background: `${color}18`,
        color,
      }}
    >
      {children}
    </span>
  );
}

export default function OptionList({ options }) {
  if (!options?.length) return null;

  const graded = options.some((o) => GRADE_RE.test(o.name));

  // 등급 표기가 없는 상품은 예전처럼 한 줄 목록.
  if (!graded) {
    return (
      <div style={{ marginTop: 16, ...rowsStyle }}>
        {options.map((o, i) => (
          <OptionRow key={i} o={o} />
        ))}
      </div>
    );
  }

  // 등급(A, B...) → 크기(대, 소) 순으로 묶는다. 등급 없는 옵션은 마지막 상자.
  const grades = [];
  const others = [];
  for (const o of options) {
    const m = o.name.match(GRADE_RE);
    if (!m) {
      others.push(o);
      continue;
    }
    const [, size, grade] = m;
    let g = grades.find((x) => x.grade === grade);
    if (!g) grades.push((g = { grade, sizes: [] }));
    let s = g.sizes.find((x) => x.size === size);
    if (!s) g.sizes.push((s = { size, items: [] }));
    s.items.push(o);
  }
  grades.sort((a, b) => a.grade.localeCompare(b.grade));
  for (const g of grades) g.sizes.sort((a, b) => (a.size === "대" ? -1 : 1) - (b.size === "대" ? -1 : 1));

  const firstWords = [...new Set(others.map((o) => o.name.split(/\s+/)[0]))];
  const othersTitle = firstWords.length === 1 ? firstWords[0] : "그 외";

  const boxStyle = (color) => ({
    border: `1.5px solid ${color}55`,
    borderRadius: 4,
    padding: 12,
    background: "var(--bg)",
  });

  return (
    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {grades.map((g) => (
        <div key={g.grade} style={boxStyle(gradeColor(g.grade))}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 4px 10px" }}>
            <Chip color={gradeColor(g.grade)}>{g.grade}급</Chip>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              {g.sizes.map((s) => `${s.size}${g.grade}`).join(" · ")}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {g.sizes.map((s) => (
              <div
                key={s.size}
                style={{ border: "1px dashed var(--line)", borderRadius: 4, padding: 10, background: "var(--bg-soft)" }}
              >
                <div style={{ fontSize: 13, fontWeight: 800, margin: "0 4px 8px" }}>
                  <span style={{ color: SIZE_COLOR[s.size] }}>{s.size}</span>
                  <span style={{ color: gradeColor(g.grade) }}>{g.grade}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--muted)", marginLeft: 6 }}>
                    {SIZE_DESC[s.size]}
                  </span>
                </div>
                <div style={rowsStyle}>
                  {s.items.map((o, i) => (
                    <OptionRow key={i} o={o} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {others.length > 0 && (
        <div style={boxStyle("#888888")}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 4px 10px" }}>
            <Chip color="#666666">{othersTitle}</Chip>
          </div>
          <div style={rowsStyle}>
            {others.map((o, i) => (
              <OptionRow key={i} o={o} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
