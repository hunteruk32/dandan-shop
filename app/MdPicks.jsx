"use client";

import { useRef } from "react";
import ProductGridCard from "./ProductGridCard";

function ArrowIcon({ dir }) {
  const d = dir === "prev" ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7";
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export default function MdPicks({ products }) {
  const picks = products.filter((p) => p.mdPick);
  const rowRef = useRef(null);

  if (picks.length === 0) return null;

  const scrollByOneCard = (dir) => {
    const el = rowRef.current;
    if (!el) return;
    const item = el.querySelector(".carousel-item");
    const gap = 10;
    const step = item ? item.getBoundingClientRect().width + gap : el.clientWidth / 4;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  return (
    <div style={{ marginTop: 40 }}>
      <div className="section-head">
        <div>
          <h2 className="section-title">단단상회 MD추천</h2>
          <p className="section-sub">엄선한 추천 상품</p>
        </div>
        {picks.length > 4 && (
          <div style={{ display: "flex", gap: 6 }}>
            <button className="carousel-arrow" onClick={() => scrollByOneCard(-1)} aria-label="이전 상품">
              <ArrowIcon dir="prev" />
            </button>
            <button className="carousel-arrow" onClick={() => scrollByOneCard(1)} aria-label="다음 상품">
              <ArrowIcon dir="next" />
            </button>
          </div>
        )}
      </div>
      <div className="carousel-row" ref={rowRef}>
        {picks.map((p) => (
          <div key={p.id} className="carousel-item">
            <ProductGridCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
}
