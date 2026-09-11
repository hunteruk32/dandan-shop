"use client";

import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };
  return (
    <button
      onClick={logout}
      style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}
    >
      로그아웃
    </button>
  );
}
