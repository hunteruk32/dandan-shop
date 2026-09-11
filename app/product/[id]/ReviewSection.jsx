"use client";

import { useState } from "react";
import Link from "next/link";

function Stars({ value, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color: "var(--gold)" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
          <path d="M12 3.5 14.7 9l6.1.9-4.4 4.3 1 6.1L12 17.3 6.6 20.3l1-6.1L3.2 9.9 9.3 9Z" strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n}점`}
          style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: n <= value ? "var(--gold)" : "var(--line)" }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill={n <= value ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3.5 14.7 9l6.1.9-4.4 4.3 1 6.1L12 17.3 6.6 20.3l1-6.1L3.2 9.9 9.3 9Z" strokeLinejoin="round" />
          </svg>
        </button>
      ))}
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function ReviewSection({ productId, initial }) {
  const [reviews, setReviews] = useState(initial.reviews);
  const [average, setAverage] = useState(initial.average);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!rating) { setError("별점을 선택해주세요."); return; }
    if (content.trim().length < 5) { setError("후기 내용을 5자 이상 적어주세요."); return; }
    setSubmitting(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("productId", productId);
      formData.append("rating", String(rating));
      formData.append("content", content.trim());
      if (photoFile) formData.append("photo", photoFile);

      const res = await fetch("/api/reviews", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "등록에 실패했어요.");

      const newReview = {
        id: data.id,
        authorName: data.authorName,
        rating,
        content: content.trim(),
        photoUrl: photoFile ? URL.createObjectURL(photoFile) : null,
        createdAt: new Date().toISOString(),
      };
      const nextReviews = [newReview, ...reviews];
      setReviews(nextReviews);
      setAverage(nextReviews.reduce((s, r) => s + r.rating, 0) / nextReviews.length);
      setRating(0);
      setContent("");
      setPhotoFile(null);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>구매 후기</h2>
          {reviews.length > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted)" }}>
              <Stars value={Math.round(average)} />
              {average.toFixed(1)} ({reviews.length})
            </span>
          )}
        </div>
        <button
          type="button"
          className="btn"
          style={{ fontSize: 12, padding: "7px 12px", background: "#fff", color: "var(--accent)", border: "1px solid var(--accent)" }}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "취소" : "후기 작성"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ flexDirection: "column", alignItems: "stretch", gap: 8, marginBottom: 14 }}>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            className="input"
            rows={3}
            placeholder="상품은 어떠셨나요? (5자 이상)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ resize: "vertical" }}
          />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          />
          {error && <p style={{ color: "var(--spice)", fontSize: 12, margin: 0 }}>{error}</p>}
          {error.includes("로그인") && (
            <Link href={`/login?next=/product/${productId}`} style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>
              로그인하러 가기 →
            </Link>
          )}
          <button className="btn" onClick={submit} disabled={submitting}>
            {submitting ? "등록 중…" : "후기 등록"}
          </button>
        </div>
      )}

      {reviews.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--muted)" }}>아직 등록된 후기가 없어요. 첫 후기를 남겨주세요!</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Stars value={r.rating} />
                  <span style={{ fontSize: 12, fontWeight: 700 }}>{r.authorName}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{formatDate(r.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{r.content}</div>
              {r.photoUrl && (
                <img src={r.photoUrl} alt="후기 사진" style={{ width: "100%", maxWidth: 240, borderRadius: 10, objectFit: "cover" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
