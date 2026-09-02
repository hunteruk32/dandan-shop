"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../CartProvider";

export default function ProductOrderPanel({ product }) {
  const router = useRouter();
  const cart = useCart();
  const [optionIndex, setOptionIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedOption = product.options[Number(optionIndex)] || null;
  const unitPrice = selectedOption ? selectedOption.price : product.price;

  const buildItem = () => ({
    productId: product.id,
    productName: product.name,
    category: product.category,
    image: product.image,
    optionName: selectedOption ? selectedOption.name : "",
    price: unitPrice,
    shippingFee: product.shippingFee || 0,
    qty: Number(qty || 1),
  });

  const addToCart = () => {
    cart.addItem(buildItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const buyNow = () => {
    cart.addItem(buildItem());
    router.push("/checkout");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
      {product.options.length > 0 && (
        <>
          <label style={{ fontSize: 13, fontWeight: 700 }}>옵션</label>
          <select className="input" value={optionIndex} onChange={(e) => setOptionIndex(e.target.value)}>
            {product.options.map((o, i) => (
              <option key={i} value={i}>
                {o.name} — {o.price.toLocaleString()}원
              </option>
            ))}
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

      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800 }}>
        <span>소계</span>
        <span style={{ color: "var(--spice)" }}>{(unitPrice * Number(qty || 1)).toLocaleString()}원</span>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn"
          style={{ flex: 1, background: "#fff", color: "var(--accent)", border: "1px solid var(--accent)" }}
          onClick={addToCart}
        >
          {added ? "담았어요 ✅" : "장바구니에 담기"}
        </button>
        <button className="btn" style={{ flex: 1 }} onClick={buyNow}>
          바로 주문하기
        </button>
      </div>
    </div>
  );
}
