"use client";

import { useEffect, useState } from "react";

// 오전 7시 마감(이미 전 사이트에서 안내 중인 실제 마감 시각)까지 남은 시간을 1초 단위로
// 보여준다. 마감 시각 자체은 lib/shippingNotice.js의 안내 문구와 같은 사실(오전 7시)을
// 쓸 뿐, 여기서 새로 만들지 않는다.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const CUTOFF_HOUR_KST = 7;

function msUntilNextCutoff(now) {
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const cutoffToday = new Date(
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate(), CUTOFF_HOUR_KST, 0, 0)
  );
  let cutoff = cutoffToday;
  if (kstNow.getTime() >= cutoffToday.getTime()) {
    cutoff = new Date(cutoffToday.getTime() + 24 * 60 * 60 * 1000);
  }
  return cutoff.getTime() - kstNow.getTime();
}

function formatRemaining(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const s = String(totalSec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function ShippingCutoffTimer() {
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    const tick = () => setRemainingMs(msUntilNextCutoff(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (remainingMs === null) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 12px",
        border: "1px solid var(--line)",
        borderRadius: 4,
        background: "var(--bg-soft)",
        fontSize: 13,
        marginTop: 12,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span style={{ color: "var(--text)" }}>
        오늘 발송 마감까지{" "}
        <b style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{formatRemaining(remainingMs)}</b>{" "}
        남음
      </span>
    </div>
  );
}
