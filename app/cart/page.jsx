"use client";

import Link from "next/link";
import { useCart } from "../CartProvider";

export default function CartPage() {
  const cart = useCart();

  return (
    <div>
      <header className="header">
        <div className="seal">단단</div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">장바구니</h1>
        </div>
      </header>

      <div className="wrap">
        <Link href="/" style={{ fontSize: 13, color: "var(--muted)" }}>← 상품 목록으로</Link>

        {!cart || cart.items.length === 0 ? (
          <div className="card" style={{ justifyContent: "center", color: "var(--muted)", fontSize: 13, marginTop: 14 }}>
            장바구니가 비어있어요.
          </div>
        ) : (
          <>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              {cart.items.map((i) => (
                <div key={i.key} className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{i.category}</div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {i.productName}
                        {i.optionName ? ` (${i.optionName})` : ""}
                      </div>
                    </div>
                    <button
                      onClick={() => cart.removeItem(i.key)}
                      style={{ border: "none", background: "none", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}
                    >
                      삭제
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={i.qty}
                      onChange={(e) => cart.updateQty(i.key, Number(e.target.value))}
                      style={{ width: 80 }}
                    />
                    <span className="price">{(i.price * i.qty).toLocaleString()}원</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "var(--muted)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>상품금액</span>
                <span>{cart.subtotal.toLocaleString()}원</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>배송비</span>
                <span>{cart.shippingTotal.toLocaleString()}원</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, marginTop: 6 }}>
              <span>총 결제금액</span>
              <span style={{ color: "var(--spice)" }}>{cart.total.toLocaleString()}원</span>
            </div>

            <Link
              href="/checkout"
              className="btn"
              style={{ display: "block", textAlign: "center", marginTop: 16 }}
            >
              주문하기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
