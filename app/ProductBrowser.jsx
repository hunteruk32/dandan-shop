"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORIES } from "@/lib/sheet";
import ProductGridCard from "./ProductGridCard";

const STATUS_OPTIONS = ["주문가능", "품절", "시즌종료"];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "salesDesc", label: "판매량 많은순" },
  { value: "priceAsc", label: "낮은 가격순" },
  { value: "priceDesc", label: "높은 가격순" },
  { value: "name", label: "이름순" },
];

export default function ProductBrowser({ products }) {
  const categories = useMemo(() => {
    const present = new Set(products.map((p) => p.category));
    return CATEGORIES.filter((c) => present.has(c));
  }, [products]);

  const statuses = useMemo(() => {
    const present = new Set(products.map((p) => p.status));
    return STATUS_OPTIONS.filter((s) => present.has(s));
  }, [products]);

  const searchParams = useSearchParams();
  const [activeCategory, setActiveCategory] = useState("전체");
  const [activeStatus, setActiveStatus] = useState("전체");
  const [sortBy, setSortBy] = useState("latest");
  const [keyword, setKeyword] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("category");
    if (fromUrl && categories.includes(fromUrl)) setActiveCategory(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (products.length === 0) {
    return (
      <div className="card" style={{ justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
        등록된 상품이 아직 없어요.
      </div>
    );
  }

  const normalizedKeyword = keyword.trim().toLowerCase();

  const filtered = products
    .filter((p) => activeCategory === "전체" || p.category === activeCategory)
    .filter((p) => activeStatus === "전체" || p.status === activeStatus)
    .filter((p) => !normalizedKeyword || p.name.toLowerCase().includes(normalizedKeyword));

  const shownProducts = [...filtered].sort((a, b) => {
    if (sortBy === "salesDesc") return (b.salesCount || 0) - (a.salesCount || 0);
    if (sortBy === "priceAsc") return a.price - b.price;
    if (sortBy === "priceDesc") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name, "ko");
    return 0; // latest: 원래 시트 순서를 뒤집어서 최근 등록한 상품이 먼저 오게
  });
  if (sortBy === "latest") shownProducts.reverse();

  return (
    <>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <input
          type="search"
          className="input"
          placeholder="상품 이름으로 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: "100%" }}
        />
      </div>

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        <div className="tabs" style={{ margin: 0, paddingBottom: 0 }}>
          <button
            className={`tab ${activeStatus === "전체" ? "active" : ""}`}
            onClick={() => setActiveStatus("전체")}
          >
            상태: 전체
          </button>
          {statuses.map((s) => (
            <button
              key={s}
              className={`tab ${s === activeStatus ? "active" : ""}`}
              onClick={() => setActiveStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          className="input"
          style={{ width: "auto", padding: "8px 10px", fontSize: 13, flexShrink: 0 }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {shownProducts.length === 0 ? (
        <div className="card" style={{ justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
          {normalizedKeyword ? `"${keyword}" 검색 결과가 없어요.` : "조건에 맞는 상품이 없어요."}
        </div>
      ) : (
        <div className="card-grid">
          {shownProducts.map((p) => (
            <ProductGridCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </>
  );
}
