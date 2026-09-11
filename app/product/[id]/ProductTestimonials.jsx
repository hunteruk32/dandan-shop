import { getTestimonialsFor } from "@/lib/testimonials";

export default function ProductTestimonials({ product }) {
  const matches = getTestimonialsFor(product);
  if (matches.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
      {matches.map((t, i) => (
        <div
          key={i}
          className="card"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 4,
            background: "#F6F8F6",
          }}
        >
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--ink)" }}>“{t.text}”</div>
          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700 }}>
            실제 구매고객 · {t.author}
          </div>
        </div>
      ))}
    </div>
  );
}
