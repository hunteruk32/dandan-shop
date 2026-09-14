"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function FailContent() {
  const params = useSearchParams();
  const message = params.get("message") || "결제가 취소되었거나 실패했어요.";

  return (
    <div style={{ marginTop: 40, textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>결제 실패</div>
      <p style={{ fontSize: 13, color: "var(--muted)" }}>{message}</p>
      <Link href="/checkout" className="btn" style={{ display: "inline-block", marginTop: 16 }}>
        다시 시도하기
      </Link>
    </div>
  );
}
