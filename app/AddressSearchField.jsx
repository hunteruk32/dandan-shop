"use client";

import { useEffect, useRef, useState } from "react";

let scriptLoadingPromise = null;
function loadDaumPostcodeScript() {
  if (typeof window !== "undefined" && window.daum?.Postcode) return Promise.resolve();
  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return scriptLoadingPromise;
}

// base: 검색으로 채워지는 도로명 주소, detail: 사용자가 직접 입력하는 상세주소(동/호수 등).
// 최종 주소 문자열이 필요하면 combineAddress(base, detail)로 합친다.
export function combineAddress(base, detail) {
  return [String(base || "").trim(), String(detail || "").trim()].filter(Boolean).join(" ");
}

export default function AddressSearchField({ base, detail, onBaseChange, onDetailChange, disabled }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // 클릭 시점에 스크립트 로딩까지 기다리면(await) 브라우저가 그 window.open을
    // "사용자 제스처 없이 연 팝업"으로 취급해서 팝업 차단에 걸린다. 그래서 컴포넌트가
    // 뜨자마자 미리 로드해두고, 검색창은 팝업이 아니라 페이지 안에 embed로 띄운다.
    loadDaumPostcodeScript().catch(() => {});
  }, []);

  useEffect(() => {
    if (!open || !containerRef.current || !window.daum?.Postcode) return;
    containerRef.current.innerHTML = "";
    new window.daum.Postcode({
      oncomplete: (data) => {
        const addr = data.roadAddress || data.jibunAddress;
        onBaseChange(`(${data.zonecode}) ${addr}`);
        setOpen(false);
      },
      width: "100%",
      height: "100%",
    }).embed(containerRef.current);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input
          className="input"
          value={base}
          readOnly
          disabled={disabled}
          placeholder="주소 검색 버튼을 눌러주세요"
          style={{ flex: 1, background: disabled ? "var(--line)" : "#fff", cursor: "pointer" }}
          onClick={() => !disabled && setOpen(true)}
        />
        <button
          type="button"
          className="btn"
          style={{ flexShrink: 0, background: "#fff", color: "var(--accent)", border: "1px solid var(--accent)" }}
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          주소 검색
        </button>
      </div>
      <input
        className="input"
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
        disabled={disabled}
        placeholder="상세주소 (동/호수 등)"
      />

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(31,42,36,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 16,
              width: "100%",
              maxWidth: 420,
              padding: 12,
              boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>주소 검색</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="닫기"
                style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>
            <div ref={containerRef} style={{ width: "100%", height: 420 }} />
          </div>
        </div>
      )}
    </div>
  );
}
