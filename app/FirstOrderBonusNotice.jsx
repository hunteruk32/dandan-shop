"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { REWARD_USE_MIN_ORDER_AMOUNT } from "@/lib/rewardPoints";

const STORAGE_KEY = "dandan-first-order-bonus-notice-dismissed-v1";
const WELCOME_BONUS_AMOUNT = 2000;

// 회원가입 유도용 — 아직 로그인하지 않은 손님에게만 홈페이지에서 크게 보여준다.
// 한 번 닫으면 다시 노출하지 않는다("오늘 하루"가 아니라 영구 닫힘).
export default function FirstOrderBonusNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      // 로컬스토리지 접근이 막혀 있어도 그냥 보여준다
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.phone) return; // 이미 로그인한 손님에겐 보여주지 않는다
        setShow(true);
      })
      .catch(() => {});
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
        background: "rgba(31,42,36,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "var(--bg)",
          borderRadius: 4,
          maxWidth: 380,
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <button
          onClick={close}
          aria-label="닫기"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.08)",
            color: "var(--ink)",
            fontSize: 16,
            lineHeight: "28px",
            cursor: "pointer",
            zIndex: 1,
          }}
        >
          ×
        </button>

        <div
          style={{
            background: "linear-gradient(135deg, var(--ink) 0%, #2E2E2E 100%)",
            padding: "28px 26px 22px",
            color: "#fff",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 3, opacity: 0.75, marginBottom: 10 }}>
            WELCOME
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>
            {WELCOME_BONUS_AMOUNT.toLocaleString()}원
          </div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 8 }}>가입하고 첫 주문하면 추가 적립</div>
        </div>

        <div style={{ padding: "22px 24px 24px" }}>
          <ul style={{ margin: "0 0 20px", padding: 0, listStyle: "none", fontSize: 13.5, lineHeight: 1.7, color: "var(--ink)" }}>
            <BonusLine>회원가입 후 첫 주문({REWARD_USE_MIN_ORDER_AMOUNT.toLocaleString()}원 이상)에만 적립돼요</BonusLine>
            <BonusLine>적립된 {WELCOME_BONUS_AMOUNT.toLocaleString()}원은 다음 주문부터 사용할 수 있어요</BonusLine>
            <BonusLine>적립금 사용도 {REWARD_USE_MIN_ORDER_AMOUNT.toLocaleString()}원 이상 주문부터 가능해요</BonusLine>
            <BonusLine>일부 특가 상품은 혜택 대상에서 제외돼요</BonusLine>
            <BonusLine last>비회원 주문에는 적립되지 않아요 — 로그인 후 주문해주세요</BonusLine>
          </ul>

          <Link
            href="/signup"
            className="btn"
            style={{ width: "100%", display: "block", textAlign: "center", boxSizing: "border-box" }}
            onClick={close}
          >
            회원가입하고 혜택받기
          </Link>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <Link href="/login" onClick={close} style={{ fontSize: 12.5, color: "var(--muted)" }}>
              이미 회원이신가요? 로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BonusLine({ children, last }) {
  return (
    <li style={{ display: "flex", gap: 8, marginBottom: last ? 0 : 8 }}>
      <span style={{ color: "var(--ink)", fontWeight: 800, flexShrink: 0 }}>·</span>
      <span>{children}</span>
    </li>
  );
}
