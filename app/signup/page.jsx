"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone.trim() || !password.trim()) return;
    if (password !== password2) {
      setError("비밀번호가 서로 달라요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "회원가입에 실패했어요.");
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wrap">
      <label style={{ fontSize: 13, fontWeight: 700 }}>전화번호</label>
      <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />

      <label style={{ fontSize: 13, fontWeight: 700, marginTop: 10, display: "block" }}>비밀번호</label>
      <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="4자 이상" />

      <label style={{ fontSize: 13, fontWeight: 700, marginTop: 10, display: "block" }}>비밀번호 확인</label>
      <input
        className="input"
        type="password"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      {error && <p style={{ color: "var(--spice)", fontSize: 13, marginTop: 8 }}>{error}</p>}

      <button className="btn" style={{ marginTop: 14, width: "100%" }} onClick={submit} disabled={loading}>
        {loading ? "가입 중…" : "회원가입"}
      </button>

      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14, textAlign: "center" }}>
        이미 계정이 있으신가요?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} style={{ color: "var(--accent)", fontWeight: 700 }}>
          로그인
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div>
      <header className="header">
        <div className="seal">단단</div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">회원가입</h1>
        </div>
      </header>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
