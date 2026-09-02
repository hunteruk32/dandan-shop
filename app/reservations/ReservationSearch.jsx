"use client";

import { useMemo, useState } from "react";

function normalizePhone(phone) {
  return String(phone || "").replace(/[^0-9]/g, "");
}

export default function ReservationSearch({ orders, myPhone }) {
  const [q, setQ] = useState("");

  const myOrders = useMemo(() => {
    if (!myPhone) return [];
    return orders.filter(
      (o) => normalizePhone(o.senderPhone) === myPhone || normalizePhone(o.recipientPhone) === myPhone
    );
  }, [orders, myPhone]);

  const searchResults = useMemo(() => {
    if (!q.trim()) return [];
    const needle = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.recipientName.toLowerCase().includes(needle) ||
        o.senderName.toLowerCase().includes(needle)
    );
  }, [q, orders]);

  const showingMine = myPhone && !q.trim();
  const results = showingMine ? myOrders : searchResults;

  return (
    <div>
      {myPhone && (
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
          로그인하신 계정({myPhone})으로 접수된 주문을 보여드려요. 다른 주문번호나 성함으로도 검색할 수 있어요.
        </p>
      )}

      <input
        className="input"
        placeholder="주문번호(예: ORD-0001) 또는 발송인/수취인 성함"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {!showingMine && q.trim() && results.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>일치하는 주문이 없어요.</p>
        )}
        {showingMine && results.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>아직 접수된 주문이 없어요.</p>
        )}
        {results.map((o, i) => (
          <div key={i} className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{o.id}</div>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{o.orderedAt}</span>
            </div>
            <div style={{ fontSize: 13, color: "#5B5648" }}>{o.item}</div>
            <div style={{ display: "flex", gap: 6 }}>
              <span className="badge" style={{ background: "#E9F3EC", color: "var(--accent)" }}>
                {o.paymentStatus}
              </span>
              <span className="badge" style={{ background: "#FBEFE6", color: "#C0511F" }}>
                {o.orderStatus}
              </span>
            </div>
            {o.trackingNumber && (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {o.courier} {o.trackingNumber}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
