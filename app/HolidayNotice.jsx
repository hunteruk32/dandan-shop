"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dandan-notice-hide-date";
// 배송 재개일(10/10)까지는 노출하고, 11일 0시부터는 자동으로 뜨지 않는다.
const NOTICE_END = new Date("2026-10-11T00:00:00+09:00").getTime();

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export default function HolidayNotice() {
  const [show, setShow] = useState(false);
  const [hideToday, setHideToday] = useState(false);

  useEffect(() => {
    if (Date.now() >= NOTICE_END) return;
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
          10월 배송 휴무 안내 🍂
        </h2>
        <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)", marginBottom: 18 }}>
          <p style={{ margin: 0 }}>
            <b>10월 8일(목) ~ 9일(금) 한글날 연휴</b>에는 배송이 진행되지 않습니다.
          </p>
          <p style={{ margin: "10px 0 0" }}>
            해당 기간 접수된 주문은 <b>10월 10일부터 순차적으로 배송</b>됩니다.
          </p>
          <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 13 }}>
            불편을 드려 죄송하며, 양해 부탁드립니다.
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
