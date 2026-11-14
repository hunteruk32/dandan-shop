"use client";

import { useState } from "react";

export default function ChangePasswordForm({ hasPassword }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (hasPassword && !currentPassword.trim()) {
      setError("현재 비밀번호를 입력해주세요.");
      return;
    }
    if (newPassword.length < 4) {
      setError("새 비밀번호는 4자 이상이어야 해요.");
      return;
    }
    if (newPassword !== newPassword2) {
      setError("새 비밀번호가 서로 달라요.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "비밀번호 변경에 실패했어요.");
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setNewPassword2("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>
        {hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
      </div>

      {hasPassword && (
        <>
          <label style={{ fontSize: 13, fontWeight: 700 }}>현재 비밀번호</label>
          <input
            className="input"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </>
      )}

      <label style={{ fontSize: 13, fontWeight: 700, marginTop: 10, display: "block" }}>새 비밀번호</label>
      <input
        className="input"
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="4자 이상"
      />

      <label style={{ fontSize: 13, fontWeight: 700, marginTop: 10, display: "block" }}>새 비밀번호 확인</label>
      <input
        className="input"
        type="password"
        value={newPassword2}
        onChange={(e) => setNewPassword2(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      {error && <p style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>{error}</p>}
      {done && <p style={{ color: "var(--ink)", fontSize: 13, marginTop: 8 }}>비밀번호가 변경됐어요.</p>}

      <button className="btn" style={{ marginTop: 14, width: "100%" }} onClick={submit} disabled={loading}>
        {loading ? "변경 중…" : hasPassword ? "비밀번호 변경" : "비밀번호 설정"}
      </button>
    </div>
  );
}
