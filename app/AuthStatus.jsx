"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthStatus({ dark = true }) {
  const router = useRouter();
  const [phone, setPhone] = useState(undefined); // undefined = loading
  const [rewardPoints, setRewardPoints] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setPhone(data.phone);
        setRewardPoints(data.rewardPoints || 0);
      })
      .catch(() => setPhone(null));
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setPhone(null);
    router.refresh();
  };

  const color = dark ? "var(--bg)" : "var(--ink)";

  if (phone === undefined) return null;

  if (!phone) {
    return (
      <Link href="/login" style={{ fontSize: 13, fontWeight: 700, color }}>
        로그인
      </Link>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: dark ? color : "var(--accent)" }}>
        적립금 {rewardPoints.toLocaleString()}원
      </span>
      <button
        onClick={logout}
        style={{ fontSize: 13, fontWeight: 700, color, background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        로그아웃
      </button>
    </div>
  );
}
