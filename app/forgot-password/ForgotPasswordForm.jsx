"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PageTitleRow from "../PageTitleRow";

export default function ForgotPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [step, setStep] = useState("phone"); // phone | verify | done
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestCode = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "인증번호 발송에 실패했어요.");
      setStep("verify");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    if (!code.trim() || !newPassword.trim()) return;
    if (newPassword !== newPassword2) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "비밀번호 변경에 실패했어요.");
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="wrap">
        <PageTitleRow title="비밀번호 찾기" />
        <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>비밀번호가 변경됐어요</div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            새 비밀번호로 다시 로그인해주세요.
          </p>
        </div>
        <button
          className="btn"
          style={{ marginTop: 14, width: "100%" }}
          onClick={() => router.push(`/login?next=${encodeURIComponent(next)}`)}
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  return (
    <div className="wrap">
      <PageTitleRow title="비밀번호 찾기" />

      <label style={{ fontSize: 13, fontWeight: 700 }}>전화번호</label>
      <input
        className="input"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="010-0000-0000"
        disabled={step === "verify"}
      />

      {step === "phone" && (
        <button className="btn" style={{ marginTop: 14, width: "100%" }} onClick={requestCode} disabled={loading}>
          {loading ? "전송 중…" : "인증번호 받기"}
        </button>
      )}

      {step === "verify" && (
        <>
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
            인증번호를 보냈어요. 5분 이내에 입력해주세요.
          </p>
          <label style={{ fontSize: 13, fontWeight: 700, marginTop: 10, display: "block" }}>인증번호</label>
          <input
            className="input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6자리 숫자"
            inputMode="numeric"
          />

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
            onKeyDown={(e) => e.key === "Enter" && confirmReset()}
          />

          <button className="btn" style={{ marginTop: 14, width: "100%" }} onClick={confirmReset} disabled={loading}>
            {loading ? "변경 중…" : "비밀번호 변경"}
          </button>

          <button
            type="button"
            onClick={requestCode}
            disabled={loading}
            style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, marginTop: 10, cursor: "pointer", width: "100%", textAlign: "center" }}
          >
            인증번호 다시 받기
          </button>
        </>
      )}

      {error && <p style={{ color: "var(--error)", fontSize: 13, marginTop: 8 }}>{error}</p>}

      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14, textAlign: "center" }}>
        <Link href={`/login?next=${encodeURIComponent(next)}`} style={{ color: "var(--ink)", fontWeight: 700 }}>
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
