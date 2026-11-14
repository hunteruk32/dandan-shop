"use client";

import { useEffect, useState } from "react";
import { getDiscount } from "@/lib/pricing";

export default function StickyBuyBar({ productName, price, hasOptions, listPrice }) {
  const discount = getDiscount(listPrice, price);
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

  // 이 바는 옵션·수량 상태를 따로 갖지 않는다 — 실제 담기/구매 로직은 상품 상세의
  // 주문 패널(ProductOrderPanel)에만 있고, 여기 두 버튼은 전부 그 패널로 스크롤시켜서
  // 실제 선택을 거기서 하게 한다(장바구니/주문 로직을 두 곳에 중복시키지 않기 위함).
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
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
        >
          {productName}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, flexShrink: 0 }}>
          {discount ? <span style={{ fontWeight: 800, fontSize: 13, color: "var(--ink)" }}>{discount.rate}%</span> : null}
          <div className="price" style={{ marginTop: 0 }}>
            {price.toLocaleString()}원{hasOptions ? "부터" : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn"
          style={{ flex: 1, minHeight: 44, background: "#fff", color: "var(--ink)", border: "1px solid var(--ink)" }}
          onClick={scrollToOrder}
        >
          장바구니
        </button>
        <button className="btn" style={{ flex: 2, minHeight: 44 }} onClick={scrollToOrder}>
          바로 구매하기
        </button>
      </div>
    </div>
  );
}
