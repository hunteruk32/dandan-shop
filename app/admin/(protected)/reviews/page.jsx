import Link from "next/link";
import { getAllReviewsForAdmin } from "@/lib/reviews";
import { getProducts } from "@/lib/sheet";
import ReviewHideToggle from "./ReviewHideToggle";

export const dynamic = "force-dynamic";

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")} ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export default async function AdminReviewsPage() {
  const [reviews, products] = await Promise.all([getAllReviewsForAdmin(), getProducts()]);
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="wrap" style={{ maxWidth: 900 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className="serif" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>리뷰 관리</h1>
        <Link href="/admin" style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>← 대시보드로</Link>
      </div>

      {reviews.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>등록된 후기가 아직 없어요.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((r) => {
            const p = productMap.get(r.productId);
            return (
              <div key={r.id} className="card" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>{p ? p.name : r.productId}</div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} · {r.authorName}
                    </div>
                  </div>
                  <ReviewHideToggle id={r.id} hidden={r.hidden} />
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{r.content}</div>
                {r.photoUrl && (
                  <img src={r.photoUrl} alt="후기 사진" style={{ width: 120, height: 120, borderRadius: 10, objectFit: "cover" }} />
                )}
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{formatDate(r.createdAt)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
