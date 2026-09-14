"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "../../CartProvider";

export default function SuccessContent() {
  const params = useSearchParams();
  const cart = useCart();
  const [state, setState] = useState("confirming"); // confirming | done | error
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const paymentKey = params.get("paymentKey");
    const orderId = params.get("orderId");
    const amount = params.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setState("error");
      setErrorMsg("결제 정보가 올바르지 않아요.");
      return;
    }

    fetch("/api/payment/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) throw new Error(data.error || "결제 승인에 실패했어요.");
        cart?.clear();
        if (typeof window !== "undefined" && typeof window.gtag === "function") {
          window.gtag("event", "conversion", {
            send_to: "AW-18369032939/qjyfCIuoyfIcEOvlhLdE",
            value: Number(amount),
            currency: "KRW",
            transaction_id: orderId,
          });
        }
        setState("done");
      })
      .catch((err) => {
        setState("error");
        setErrorMsg(err.message || "결제 승인 중 오류가 발생했어요.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "confirming") {
    return <p style={{ marginTop: 40, textAlign: "center" }}>결제를 확인하고 있어요…</p>;
  }

  if (state === "error") {
    return (
      <div style={{ marginTop: 40, textAlign: "center" }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>결제 승인 실패</div>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>{errorMsg}</p>
        <Link href="/checkout" className="btn" style={{ display: "inline-block", marginTop: 16 }}>
          다시 시도하기
        </Link>
      </div>
    );
  }

  return (
    <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, marginTop: 20 }}>
      <div style={{ fontWeight: 800, fontSize: 15 }}>결제 완료 ✅</div>
      <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
        주문이 정상적으로 접수됐어요. &quot;내 주문 확인&quot;에서 진행 상황을 확인할 수 있어요.
      </p>
      <Link href="/reservations" className="btn" style={{ display: "block", textAlign: "center", marginTop: 8, width: "100%" }}>
        내 주문 확인하기
      </Link>
      <Link href="/" style={{ display: "block", textAlign: "center", marginTop: 8, width: "100%", fontSize: 13, color: "var(--muted)" }}>
        상품 목록으로
      </Link>
    </div>
  );
}
