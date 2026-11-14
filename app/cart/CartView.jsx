"use client";

import Link from "next/link";
import { useCart } from "../CartProvider";
import PageTitleRow from "../PageTitleRow";
import { REWARD_USE_MIN_ORDER_AMOUNT } from "@/lib/rewardPoints";
import { isBenefitExcludedProduct } from "@/lib/benefitExclusions";

export default function CartView() {
  const cart = useCart();

  // 무료배송 기준은 실제로 없어서(배송비는 전부 상품별로만 계산됨) 보여주지 않는다.
  // 대신 실제로 존재하는 기준 — 적립금 사용·가입 후 첫 주문 추가 적립은 3만원 이상
  // 주문부터 적용됨(lib/rewardPoints.js) — 을 그대로 가져와서 진행률로 보여준다.
  const eligibleAmount = cart?.items
    ? cart.items.reduce((sum, i) => (isBenefitExcludedProduct(i.productId) ? sum : sum + i.price * i.qty), 0)
    : 0;
  const remaining = Math.max(0, REWARD_USE_MIN_ORDER_AMOUNT - eligibleAmount);
  const progressPct = Math.min(100, (eligibleAmount / REWARD_USE_MIN_ORDER_AMOUNT) * 100);

  return (
    <div className="wrap">
      <PageTitleRow title="장바구니" />
      {!cart || cart.items.length === 0 ? (
        <div className="card" style={{ justifyContent: "center", color: "var(--muted)", fontSize: 13, marginTop: 14 }}>
          장바구니가 비어있어요.
        </div>
      ) : (
        <>
          <div style={{ marginTop: 14, marginBottom: 4 }}>
            <div style={{ fontSize: 12.5, color: "var(--text)", marginBottom: 6 }}>
              {remaining > 0 ? (
                <>
                  {remaining.toLocaleString()}원 더 담으면{" "}
                  <b style={{ color: "var(--ink)" }}>적립금 사용·첫 주문 추가 적립</b> 조건을 채워요
                </>
              ) : (
                <>
                  <b style={{ color: "var(--ink)" }}>{REWARD_USE_MIN_ORDER_AMOUNT.toLocaleString()}원</b> 이상 주문 조건을
                  채웠어요
                </>
              )}
            </div>
            <div style={{ height: 6, background: "var(--line)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${progressPct}%`, height: "100%", background: "var(--ink)" }} />
            </div>
          </div>

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
            <span style={{ color: "var(--ink)" }}>{cart.total.toLocaleString()}원</span>
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
  );
}
