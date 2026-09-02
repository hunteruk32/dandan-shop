"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { STATUS_STYLE } from "@/lib/sheet";

function fmtDate(d) {
  const dt = new Date(d + "T00:00:00");
  if (isNaN(dt)) return d;
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${dt.getMonth() + 1}/${dt.getDate()}(${days[dt.getDay()]})`;
}

export default function ProductBrowser({ products }) {
  const dates = useMemo(
    () => Array.from(new Set(products.map((p) => p.date))).sort(),
    [products]
  );
  const [activeDate, setActiveDate] = useState(dates[0] || "");
  const dayProducts = products.filter((p) => p.date === activeDate);

  if (dates.length === 0) {
    return (
      <div className="card" style={{ justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
        등록된 상품이 아직 없어요.
      </div>
    );
  }

  return (
    <>
      <div className="tabs">
        {dates.map((d) => (
          <button
            key={d}
            className={`tab ${d === activeDate ? "active" : ""}`}
            onClick={() => setActiveDate(d)}
          >
            {fmtDate(d)}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {dayProducts.map((p) => {
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
