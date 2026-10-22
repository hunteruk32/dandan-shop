"use client";

import { useState } from "react";

// 더블탭/더블클릭으로 다운로드 요청이 두 번 나가면, 첫 번째 요청에서 이미
// "발주 처리됨"으로 기록돼서 두 번째 요청이 "발주 대기 중인 주문이 없어요"
// 에러(JSON)를 그대로 보여주는 혼란스러운 상황이 생길 수 있었다.
// 일반 <a href> 대신 클릭 즉시 버튼을 비활성화해서 중복 요청 자체를 막는다.
export default function DownloadOrderExcelButton({ supplier }) {
  const [state, setState] = useState("idle"); // idle | loading | error

  const download = async () => {
    if (state === "loading") return;
    setState("loading");
    try {
      const res = await fetch(`/api/admin/purchase-orders/excel?supplier=${encodeURIComponent(supplier)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "다운로드에 실패했어요.");
      }
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const fileName = match ? decodeURIComponent(match[1]) : `${supplier}_발주서.xlsx`;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch (err) {
      setState("error");
      alert(err.message);
      setState("idle");
    }
  };

  return (
    <button
      type="button"
      className="btn"
      style={{ fontSize: 13, padding: "8px 14px", opacity: state === "loading" ? 0.6 : 1 }}
      onClick={download}
      disabled={state === "loading"}
    >
      {state === "loading" ? "다운로드 중…" : "발주서 다운로드 (엑셀)"}
    </button>
  );
}
