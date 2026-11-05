"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dandan-card-payment-notice-seen";
// 딱 1주일만 노출하고, 그 이후로는 신규 방문자에게도 자동으로 뜨지 않는다.
const NOTICE_END = new Date("2026-11-12T00:00:00+09:00").getTime();

export default function CardPaymentNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (Date.now() >= NOTICE_END) return;
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // 저장 실패해도 그냥 닫히게 둔다
    }
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(31,42,36,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg)",
          borderRadius: 16,
          maxWidth: 340,
          width: "100%",
          padding: "24px 22px 18px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)", letterSpacing: 2, marginBottom: 6 }}>
          NEW
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px", color: "var(--ink)" }}>
          카드결제 오픈했어요 💳
        </h2>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)", marginBottom: 18 }}>
          <p style={{ margin: 0 }}>
            이제 <b>계좌이체뿐 아니라 신용·체크카드</b>로도 편하게 결제하실 수 있어요.
          </p>
          <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 13 }}>
            주문 시 결제 방법에서 "카드결제"를 선택해주세요.
          </p>
        </div>

        <button className="btn" style={{ width: "100%" }} onClick={close}>
          확인
        </button>
      </div>
    </div>
  );
}
