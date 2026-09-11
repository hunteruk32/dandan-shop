"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NavIcons from "../../NavIcons";

export default function CompletePhonePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("checking"); // checking | ready | submitting | expired
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/auth/pending")
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) {
          setState("expired");
        } else {
          setNickname(data.nickname || "");
          setState("ready");
        }
      });
  }, []);

  const submit = async () => {
    setState("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/complete-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "실패했어요.");
      router.push(data.next || "/");
      router.refresh();
    } catch (err) {
      setState("ready");
      setErrorMsg(err.message || "오류가 발생했어요.");
    }
  };

  if (state === "checking") return null;

  if (state === "expired") {
    return (
      <div className="wrap">
        <p style={{ marginTop: 40 }}>인증 정보가 만료되었어요. 다시 로그인해주세요.</p>
        <a href="/login" className="btn" style={{ display: "inline-block", marginTop: 12 }}>
          로그인으로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div>
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">거의 다 됐어요</h1>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <NavIcons />
        </div>
      </header>
      <div className="wrap">
        <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 14 }}>
          {nickname ? `${nickname}님, ` : ""}주문·배송 연락처로 사용할 전화번호를 입력해주세요.
        </p>
        <label style={{ fontSize: 13, fontWeight: 700, marginTop: 10, display: "block" }}>전화번호</label>
        <input
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="010-0000-0000"
        />
        {errorMsg && <p style={{ color: "var(--spice)", fontSize: 13, marginTop: 8 }}>{errorMsg}</p>}
        <button
          className="btn"
          style={{ marginTop: 14, width: "100%" }}
          onClick={submit}
          disabled={state === "submitting" || phone.trim().length < 9}
        >
          {state === "submitting" ? "처리 중…" : "시작하기"}
        </button>
      </div>
    </div>
  );
}
