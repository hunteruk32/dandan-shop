import { hasAnyTrustSection } from "@/lib/trustSections";

// 상세페이지 하단에 붙는 신뢰 섹션들(브랜드 스토리·차별화 기술·공정 단계·조리 비주얼·
// Q&A·크기 안내·인증서) — 상품마스터 시트의 trust_* 열을 채운 상품에만 해당 섹션이 뜬다.
// 섹션별로 독립적이라, 일부만 채워도(예: 공정 단계만) 그 섹션만 보이고 나머지는 생략된다.

function Heading({ children }) {
  return (
    <h3 className="serif" style={{ fontSize: 17, fontWeight: 800, textAlign: "center", margin: "0 0 8px" }}>
      {children}
    </h3>
  );
}

function Body({ children }) {
  if (!children) return null;
  return (
    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, textAlign: "center", whiteSpace: "pre-line", margin: "0 0 12px" }}>
      {children}
    </p>
  );
}

export default function ProductTrustSections({ product }) {
  const trust = product?.trust;
  if (!hasAnyTrustSection(trust)) return null;

  const { story, tech, steps, cook, faq, sizeGuide, cert } = trust;

  return (
    <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 32 }}>
      {story && (
        <section>
          {story.title && <Heading>{story.title}</Heading>}
          <Body>{story.body}</Body>
          {story.image && <img src={story.image} alt={story.title || product.name} style={{ width: "100%", display: "block", borderRadius: 4 }} />}
        </section>
      )}

      {tech && (
        <section style={{ background: "var(--bg-soft)", padding: "20px 14px", borderRadius: 4 }}>
          {tech.title && <Heading>{tech.title}</Heading>}
          <Body>{tech.body}</Body>
          {tech.image && <img src={tech.image} alt={tech.title || product.name} style={{ width: "100%", display: "block", borderRadius: 4 }} />}
        </section>
      )}

      {steps.length > 0 && (
        <section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ position: "relative", borderRadius: 4, overflow: "hidden", background: "var(--bg-soft)" }}>
                {s.image ? (
                  <img src={s.image} alt={s.title} style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ aspectRatio: "1 / 1" }} />
                )}
                {s.title && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        background: "var(--ink)",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                      }}
                    >
                      {i + 1}
                    </span>
                    {s.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {cook && (
        <section>
          {cook.title && <Heading>{cook.title}</Heading>}
          <Body>{cook.body}</Body>
          {cook.images.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {cook.images.map((src, i) => (
                <img key={i} src={src} alt={cook.title || product.name} style={{ width: "100%", display: "block", borderRadius: 4 }} />
              ))}
            </div>
          )}
        </section>
      )}

      {faq.length > 0 && (
        <section>
          <Heading>맛있게 먹는 방법</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            {faq.map((f, i) => (
              <div key={i} style={{ background: "var(--ink)", color: "#fff", borderRadius: 4, padding: "12px 14px" }}>
                <div style={{ fontWeight: 800, fontSize: 13, marginBottom: f.a ? 4 : 0 }}>· {f.q}</div>
                {f.a && <div style={{ fontSize: 12, opacity: 0.9, lineHeight: 1.6 }}>{f.a}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {sizeGuide.length > 0 && (
        <section>
          <Heading>크기 안내</Heading>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
            {sizeGuide.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {s.image && (
                  <img src={s.image} alt={s.label} style={{ width: 90, height: 60, objectFit: "contain", flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{s.label}</div>
                  {s.note && <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cert && (
        <section>
          {cert.title && <Heading>{cert.title}</Heading>}
          {cert.images.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginTop: 12 }}>
              {cert.images.map((src, i) => (
                <img key={i} src={src} alt="" style={{ width: "100%", display: "block", border: "1px solid var(--line)", borderRadius: 4 }} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
