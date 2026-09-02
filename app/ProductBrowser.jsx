"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUS_STYLE, CATEGORIES } from "@/lib/sheet";

export default function ProductBrowser({ products }) {
  const categories = useMemo(() => {
    const present = new Set(products.map((p) => p.category));
    return CATEGORIES.filter((c) => present.has(c));
  }, [products]);

  const [activeCategory, setActiveCategory] = useState("전체");

  if (products.length === 0) {
    return (
      <div className="card" style={{ justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
        등록된 상품이 아직 없어요.
      </div>
    );
  }

  const shownProducts =
    activeCategory === "전체" ? products : products.filter((p) => p.category === activeCategory);

  return (
    <>
      <div className="tabs">
        <button
          className={`tab ${activeCategory === "전체" ? "active" : ""}`}
          onClick={() => setActiveCategory("전체")}
        >
          전체
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={`tab ${c === activeCategory ? "active" : ""}`}
            onClick={() => setActiveCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shownProducts.map((p) => {
          const s = STATUS_STYLE[p.status] || STATUS_STYLE["주문가능"];
          return (
            <Link key={p.id} href={`/product/${p.id}`} className="card">
              {p.image ? (
                <img className="thumb" src={p.image} alt={p.name} />
              ) : (
                <div className="thumb" />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 3 }}>{p.category}</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                <div className="price">
                  {p.price.toLocaleString()}원{p.options.length > 1 ? "부터" : ""}
                </div>
              </div>
              <span className="badge" style={{ background: s.bg, color: s.fg }}>{p.status}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
