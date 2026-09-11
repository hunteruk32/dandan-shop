"use client";

import { useEffect, useState } from "react";

export default function StickyBuyBar({ productName, price, hasOptions }) {
  const [topVisible, setTopVisible] = useState(true);
  const [bottomVisible, setBottomVisible] = useState(false);

  useEffect(() => {
    const top = document.getElementById("quick-order");
    const bottom = document.getElementById("bottom-order");
    if (!top || !bottom) return;

    const topObserver = new IntersectionObserver(([entry]) => setTopVisible(entry.isIntersecting), {
      threshold: 0,
    });
    const bottomObserver = new IntersectionObserver(([entry]) => setBottomVisible(entry.isIntersecting), {
      threshold: 0,
    });
    topObserver.observe(top);
    bottomObserver.observe(bottom);
    return () => {
      topObserver.disconnect();
      bottomObserver.disconnect();
    };
  }, []);

  const scrollToOrder = () => {
    document.getElementById("quick-order")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (topVisible || bottomVisible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: "#fff",
        borderTop: "1px solid var(--line)",
        boxShadow: "0 -6px 20px rgba(0,0,0,0.08)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {productName}
        </div>
        <div className="price" style={{ marginTop: 0 }}>
          {price.toLocaleString()}원{hasOptions ? "부터" : ""}
        </div>
      </div>
      <button className="btn" style={{ flexShrink: 0 }} onClick={scrollToOrder}>
        주문하기
      </button>
    </div>
  );
}
