"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReviewHideToggle({ id, hidden }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, hidden: !hidden }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="badge"
      style={{
        border: "none",
        cursor: "pointer",
        background: hidden ? "#EFEDE7" : "#E9F3EC",
        color: hidden ? "#8A8172" : "#2F6F4E",
      }}
    >
      {hidden ? "숨김 중 · 다시 보이기" : "노출 중 · 숨기기"}
    </button>
  );
}
