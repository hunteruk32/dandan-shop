"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NavIcons({ dark = true }) {
  const router = useRouter();
  const color = dark ? "var(--bg)" : "var(--ink)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, color }}>
      <button onClick={() => router.back()} aria-label="이전으로 가기" className="nav-icon-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5 8 12l7 7" />
        </svg>
      </button>
      <Link href="/" aria-label="홈으로" className="nav-icon-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
        </svg>
      </Link>
    </div>
  );
}
