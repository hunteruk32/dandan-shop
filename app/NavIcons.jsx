"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NavIcons({ dark = true }) {
  const router = useRouter();
  const color = dark ? "var(--bg)" : "var(--ink)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      <button
        onClick={() => router.back()}
        aria-label="이전으로 가기"
        style={{ background: "none", border: "none", padding: 0, fontSize: 19, lineHeight: 1, cursor: "pointer", color }}
      >
        ◀
      </button>
      <Link href="/" aria-label="홈으로" style={{ fontSize: 18, lineHeight: 1, display: "flex", color }}>
        🏠
      </Link>
    </div>
  );
}
