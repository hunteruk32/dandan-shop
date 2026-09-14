"use client";

import { useEffect, useRef, useState } from "react";

// 토스페이먼츠 결제위젯(SDK v2). amount가 바뀔 때마다(장바구니 수량 변경 등) 위젯 금액도
// 다시 맞춰준다. 실제 "결제하기" 버튼은 이 컴포넌트 밖(체크아웃 폼)에서 onReady로 받은
// requestPayment 함수를 호출해서 누른다 — 주문 생성(POST /api/order) 이후에 호출해야
// orderId가 정해지기 때문.
export default function TossPaymentWidget({ amount, onReady }) {
  const widgetsRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        if (!clientKey) {
          setError("카드결제 연동이 아직 설정되지 않았어요.");
          return;
        }
        const tossPayments = await loadTossPayments(clientKey);
        if (cancelled) return;

        const customerKey = `dandan_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const widgets = tossPayments.widgets({ customerKey });
        widgetsRef.current = widgets;

        await widgets.setAmount({ value: amount, currency: "KRW" });
        await widgets.renderPaymentMethods({ selector: "#toss-payment-method" });
        await widgets.renderAgreement({ selector: "#toss-agreement" });

        if (!cancelled) {
          onReady((requestOptions) => widgets.requestPayment(requestOptions));
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "결제창을 불러오지 못했어요.");
      }
    }

    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (widgetsRef.current) {
      widgetsRef.current.setAmount({ value: amount, currency: "KRW" }).catch(() => {});
    }
  }, [amount]);

  if (error) {
    return <p style={{ color: "var(--spice)", fontSize: 13, marginTop: 8 }}>{error}</p>;
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div id="toss-payment-method" />
      <div id="toss-agreement" />
    </div>
  );
}
