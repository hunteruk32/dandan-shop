"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavIcons from "../NavIcons";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!phone.trim() || !password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "로그인에 실패했어요.");
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
      <input
        className="input"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />

      {error && <p style={{ color: "var(--spice)", fontSize: 13, marginTop: 8 }}>{error}</p>}

      <button className="btn" style={{ marginTop: 14, width: "100%" }} onClick={submit} disabled={loading}>
        {loading ? "로그인 중…" : "로그인"}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>또는</span>
        <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
      </div>

      <a
        href={`/api/auth/kakao?next=${encodeURIComponent(next)}`}
        className="btn"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          width: "100%",
          background: "#FEE500",
          color: "#191600",
          border: "none",
        }}
      >
        💬 카카오로 3초 만에 시작하기
      </a>

      <a
        href={`/api/auth/naver?next=${encodeURIComponent(next)}`}
        className="btn"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          width: "100%",
          marginTop: 8,
          background: "#03C75A",
          color: "#fff",
          border: "none",
        }}
      >
        N 네이버로 3초 만에 시작하기
      </a>

      <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14, textAlign: "center" }}>
        계정이 없으신가요?{" "}
        <Link href={`/signup?next=${encodeURIComponent(next)}`} style={{ color: "var(--accent)", fontWeight: 700 }}>
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div>
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">로그인</h1>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <NavIcons />
        </div>
      </header>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
