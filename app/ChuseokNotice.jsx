"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dandan-notice-hide-date";

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function ChuseokNotice() {
  const [show, setShow] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    try {
      const hiddenDate = localStorage.getItem(STORAGE_KEY);
      if (hiddenDate !== todayString()) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const close = () => {
    if (hideToday) {
      try {
        localStorage.setItem(STORAGE_KEY, todayString());
      } catch {
        // 저장 실패해도 그냥 닫히게 둔다
      }
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
          NOTICE
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 12px", color: "var(--ink)" }}>
          추석연휴 배송 안내 🌕
        </h2>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)", marginBottom: 18 }}>
          <p style={{ margin: 0 }}>즐거운 추석 연휴 보내시길 바라며, 명절 배송 일정을 안내드립니다.</p>
          <p style={{ margin: "10px 0 0" }}>
            <b>주문 마감: 9월 18일</b>
            <br />
            이후 접수된 주문은 <b>9월 28일부터 순차적으로 배송</b>됩니다.
          </p>
          <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 13 }}>
            택배 물량 증가로 배송이 다소 지연될 수 있는 점 양해 부탁드립니다.
          </p>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)", marginBottom: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={hideToday} onChange={(e) => setHideToday(e.target.checked)} />
          오늘 하루 보지 않기
        </label>

        <button className="btn" style={{ width: "100%" }} onClick={close}>
          확인
        </button>
      </div>
    </div>
  );
}
