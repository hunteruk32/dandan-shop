"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../CartProvider";
import { getDiscount } from "@/lib/pricing";

export default function ProductOrderPanel({ product }) {
  const router = useRouter();
  const cart = useCart();
  const [optionIndex, setOptionIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const purchasable = product.status === "주문가능";
  const selectedOption = product.options[Number(optionIndex)] || null;
  const unitPrice = selectedOption ? selectedOption.price : product.price;
  const discount = getDiscount(selectedOption?.listPrice, unitPrice);

  // 다른 상품과 함께 담았을 때 실제로 청구되는 배송비(합배송·묶음배송 등)는 장바구니
  // 전체를 봐야 정확히 계산되지만(lib/shipping.js), 이 상품 하나만 놓고 보는 화면이라
  // 그 상품 자체의 합배송 가능 수량(박스당 수량)만 반영해서 미리보기로 보여준다.
  const combinedQty = Number(product.combinedShippingQty) || 0;
  const boxes = combinedQty > 0 ? Math.max(1, Math.ceil(Number(qty || 1) / combinedQty)) : 1;
  const shippingFee = (Number(product.shippingFee) || 0) * boxes;

  const buildItem = () => ({
    productId: product.id,
    productName: product.name,
    category: product.category,
    image: product.image,
    optionName: selectedOption ? selectedOption.name : "",
    price: unitPrice,
    shippingFee: product.shippingFee || 0,
    combinedShippingQty: product.combinedShippingQty || 0,
    weightG: selectedOption ? selectedOption.weightG || 0 : 0,
    qty: Number(qty || 1),
  });

  const trackAddToCart = () => {
    fetch("/api/track/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "add_to_cart", productId: product.id }),
      keepalive: true,
    }).catch(() => {});
  };

  const addToCart = () => {
    if (!purchasable) return;
    cart.addItem(buildItem());
    trackAddToCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const buyNow = () => {
    if (!purchasable) return;
    cart.addItem(buildItem());
    trackAddToCart();
    router.push("/checkout");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
      {product.options.length > 0 && (
        <>
          <label style={{ fontSize: 13, fontWeight: 700 }}>옵션</label>
          <select className="input" value={optionIndex} onChange={(e) => setOptionIndex(e.target.value)}>
            {product.options.map((o, i) => {
              const d = getDiscount(o.listPrice, o.price);
              return (
                <option key={i} value={i}>
                  {o.name} — {o.price.toLocaleString()}원{d ? ` (${d.rate}%↓)` : ""}
                </option>
              );
            })}
          </select>
        </>
      )}

      <label style={{ fontSize: 13, fontWeight: 700 }}>수량</label>
      <input
        className="input"
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
        <span>배송비</span>
        <span>{shippingFee ? `${shippingFee.toLocaleString()}원` : "무료"}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 15, fontWeight: 800 }}>
        <span>합계</span>
        <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          {discount ? (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", textDecoration: "line-through" }}>
              {(discount.listPrice * Number(qty || 1) + shippingFee).toLocaleString()}원
            </span>
          ) : null}
          {discount ? <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{discount.rate}%</span> : null}
          <span style={{ color: "var(--ink)" }}>{(unitPrice * Number(qty || 1) + shippingFee).toLocaleString()}원</span>
        </span>
      </div>

      {!purchasable && (
        <p style={{ fontSize: 13, color: "var(--ink)", fontWeight: 700, margin: 0 }}>
          {product.status === "품절" ? "일시 품절된 상품이에요." : `현재 ${product.status} 상품이라 주문할 수 없어요.`}
        </p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn"
          style={{
            flex: 1,
            background: "#fff",
            color: "var(--ink)",
            border: "1px solid var(--ink)",
            opacity: purchasable ? 1 : 0.5,
            cursor: purchasable ? "pointer" : "not-allowed",
          }}
          onClick={addToCart}
          disabled={!purchasable}
        >
          {added ? "담았어요" : "장바구니에 담기"}
        </button>
        <button
          className="btn"
          style={{ flex: 1, opacity: purchasable ? 1 : 0.5, cursor: purchasable ? "pointer" : "not-allowed" }}
          onClick={buyNow}
          disabled={!purchasable}
        >
          {purchasable ? "바로 주문하기" : product.status}
        </button>
      </div>
    </div>
  );
}
