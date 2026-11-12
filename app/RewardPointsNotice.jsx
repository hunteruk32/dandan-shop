"use client";

import { useEffect, useState } from "react";
import { dismissForToday, isDismissedToday } from "@/lib/dismissToday";
import { REWARD_USE_THRESHOLD, REWARD_USE_MIN_ORDER_AMOUNT } from "@/lib/rewardPoints";

const STORAGE_KEY = "dandan-reward-points-notice-dismissed";

// 로그인한 손님에게 홈페이지 접속 시 적립금 제도를 안내한다("오늘 하루 보지 않기" 체크 전까진 매일 노출).
export default function RewardPointsNotice() {
  const [show, setShow] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [dontShowToday, setDontShowToday] = useState(false);

  useEffect(() => {
    if (isDismissedToday(STORAGE_KEY)) return;

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.phone) return;
        setRewardPoints(data.rewardPoints || 0);
        setShow(true);
      })
      .catch(() => {});
  }, []);

  const close = () => {
    if (dontShowToday) dismissForToday(STORAGE_KEY);
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
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--accent)", letterSpacing: 2, marginBottom: 6 }}>
          적립 혜택
        </div>
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 14px", color: "var(--ink)", lineHeight: 1.4 }}>
          계좌이체 주문, 1% 적립돼요 🎁
        </h2>

        <div
          style={{
            background: "rgba(0,0,0,0.035)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 14,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>현재 보유 적립금</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--spice)", letterSpacing: -0.5 }}>
            {rewardPoints.toLocaleString()}원
          </div>
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)", marginBottom: 18 }}>
          <p style={{ margin: 0 }}>
            계좌이체로 주문하면 구매확정 시 <b>결제금액의 1%</b>가 적립돼요.
          </p>
          <p style={{ margin: "6px 0 0", color: "var(--muted)", fontSize: 13 }}>
            {REWARD_USE_THRESHOLD.toLocaleString()}원 이상 적립되면 {REWARD_USE_MIN_ORDER_AMOUNT.toLocaleString()}원 이상 주문부터
            자유롭게 사용할 수 있어요.
          </p>
        </div>

        <label
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)", marginBottom: 12, cursor: "pointer" }}
        >
          <input
            type="checkbox"
            checked={dontShowToday}
            onChange={(e) => setDontShowToday(e.target.checked)}
          />
          오늘 하루 보지 않기
        </label>

        <button className="btn" style={{ width: "100%" }} onClick={close}>
          확인
        </button>
      </div>
    </div>
  );
}
