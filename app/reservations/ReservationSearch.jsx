"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_STYLE, ORDER_STATUS_DEFAULT_STYLE } from "@/lib/sheet";

function groupOrders(orders) {
  const map = new Map();
  for (const o of orders) {
    if (!map.has(o.id)) {
      map.set(o.id, {
        id: o.id,
        orderedAt: o.orderedAt,
        senderName: o.senderName,
        senderAddress: o.senderAddress,
        recipientName: o.recipientName,
        recipientPhone: o.recipientPhone,
        recipientAddress: o.recipientAddress,
        paymentStatus: o.paymentStatus,
        note: o.note,
        history: o.history,
        items: [],
        totalAmount: 0,
      });
    }
    const g = map.get(o.id);
    g.items.push(o);
    g.totalAmount += o.totalAmount;
  }
  return Array.from(map.values());
}

export default function ReservationSearch({ orders, myPhone }) {
  const [localOrders, setLocalOrders] = useState(orders);
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | error
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const grouped = useMemo(() => groupOrders(localOrders), [localOrders]);

  const results = useMemo(() => {
    if (!q.trim()) return grouped;
    const needle = q.trim().toLowerCase();
    return grouped.filter(
      (o) =>
        o.id.toLowerCase().includes(needle) ||
        o.recipientName.toLowerCase().includes(needle) ||
        o.senderName.toLowerCase().includes(needle)
    );
  }, [q, grouped]);

  if (!myPhone) {
    return (
      <p style={{ fontSize: 13, color: "var(--muted)" }}>
        <Link href="/login?next=/reservations" style={{ color: "var(--accent)", fontWeight: 700 }}>
          로그인
        </Link>
        하시면 내 주문을 확인할 수 있어요.
      </p>
    );
  }

  const toggleExpand = (order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      setEditingId(null);
      return;
    }
    setExpandedId(order.id);
    setEditingId(null);
  };

  const startEdit = (order) => {
    setEditingId(order.id);
    setEditForm({
      recipientName: order.recipientName,
      recipientPhone: order.recipientPhone,
      recipientAddress: order.recipientAddress,
      note: order.note,
    });
    setSaveState("idle");
    setSaveError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setSaveState("idle");
    setSaveError("");
  };

  const updateField = (k) => (e) => setEditForm((f) => ({ ...f, [k]: e.target.value }));

  const saveEdit = async (order) => {
    if (!editForm.recipientName.trim() || !editForm.recipientPhone.trim() || !editForm.recipientAddress.trim()) {
      setSaveState("error");
      setSaveError("수취인 성함/전화번호/주소는 비워둘 수 없어요.");
      return;
    }
    setSaveState("saving");
    setSaveError("");
    try {
      const res = await fetch("/api/order/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          recipientName: editForm.recipientName.trim(),
          recipientPhone: editForm.recipientPhone.trim(),
          recipientAddress: editForm.recipientAddress.trim(),
          note: editForm.note.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "수정에 실패했어요.");

      setLocalOrders((prev) =>
        prev.map((o) => {
          if (o.id !== order.id) return o;
          const next = {
            ...o,
            recipientName: editForm.recipientName.trim(),
            recipientPhone: editForm.recipientPhone.trim(),
            recipientAddress: editForm.recipientAddress.trim(),
            note: editForm.note.trim(),
          };
          if (data.changed && data.historyEntry) {
            next.history = o.history ? `${o.history}\n${data.historyEntry}` : data.historyEntry;
          }
          return next;
        })
      );
      setEditingId(null);
      setEditForm(null);
      setSaveState("idle");
    } catch (err) {
      setSaveState("error");
      setSaveError(err.message || "수정 중 오류가 발생했어요.");
    }
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
        로그인하신 계정({myPhone})으로 접수된 내 주문만 보여드려요.
      </p>

      <input
        className="input"
        placeholder="주문번호(예: ORD-260907-8287-0001) 또는 발송인/수취인 성함으로 내 주문 검색"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {q.trim() && results.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>일치하는 주문이 없어요.</p>
        )}
        {!q.trim() && results.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>아직 접수된 주문이 없어요.</p>
        )}
        {results.map((order) => {
          const isExpanded = expandedId === order.id;
          const isEditing = editingId === order.id;
          const canEdit = order.paymentStatus === "입금대기";
          const historyLines = order.history ? order.history.split("\n").filter(Boolean) : [];

          return (
            <div key={order.id} className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 0, padding: 0, overflow: "hidden" }}>
              <button
                onClick={() => toggleExpand(order)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{order.id}</div>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{order.orderedAt}</span>
                </div>
                <div style={{ fontSize: 13, color: "#5B5648" }}>
                  {order.items.length > 1 ? `상품 ${order.items.length}건` : order.items[0]?.item}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <span className="badge" style={{ background: "#E9F3EC", color: "var(--accent)" }}>
                    {order.paymentStatus}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {order.totalAmount.toLocaleString()}원 · {isExpanded ? "닫기" : "상세보기"}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div style={{ width: "100%", padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 10, borderTop: "1px solid var(--line)" }}>
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>발송인(주문자)</div>
                    <div style={{ fontSize: 13 }}>{order.senderName}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)" }}>{order.senderAddress}</div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>수취인(받는 분)</div>
                      {canEdit && !isEditing && (
                        <button
                          onClick={() => startEdit(order)}
                          style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}
                        >
                          수정하기
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <input className="input" value={editForm.recipientName} onChange={updateField("recipientName")} placeholder="수취인 성함" />
                        <input className="input" value={editForm.recipientPhone} onChange={updateField("recipientPhone")} placeholder="수취인 전화번호" />
                        <input className="input" value={editForm.recipientAddress} onChange={updateField("recipientAddress")} placeholder="수취인 주소" />
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginTop: 4 }}>비고</label>
                        <textarea
                          className="input"
                          value={editForm.note}
                          onChange={updateField("note")}
                          rows={2}
                          style={{ resize: "vertical" }}
                          placeholder="배송/포장 관련 요청사항 (선택)"
                        />
                        {saveState === "error" && <p style={{ color: "var(--spice)", fontSize: 12, margin: 0 }}>{saveError}</p>}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn"
                            style={{ flex: 1, background: "#fff", color: "var(--ink)", border: "1px solid var(--line)" }}
                            onClick={cancelEdit}
                            disabled={saveState === "saving"}
                          >
                            취소
                          </button>
                          <button className="btn" style={{ flex: 1 }} onClick={() => saveEdit(order)} disabled={saveState === "saving"}>
                            {saveState === "saving" ? "저장 중…" : "저장"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 13 }}>{order.recipientName}</div>
                        <div style={{ fontSize: 13, color: "var(--muted)" }}>{order.recipientPhone}</div>
                        <div style={{ fontSize: 13, color: "var(--muted)" }}>{order.recipientAddress}</div>
                      </>
                    )}
                  </div>

                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>주문 상품</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {order.items.map((it, i) => {
                        const s = ORDER_STATUS_STYLE[it.orderStatus] || ORDER_STATUS_DEFAULT_STYLE;
                        return (
                          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "8px 10px", background: "var(--line)", borderRadius: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                              <span>{it.item}</span>
                              <span style={{ fontWeight: 700 }}>{it.totalAmount.toLocaleString()}원</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span className="badge" style={{ background: s.bg, color: s.fg }}>{it.orderStatus}</span>
                              {it.trackingNumber && (
                                <span style={{ fontSize: 12, color: "var(--muted)" }}>{it.courier} {it.trackingNumber}</span>
                              )}
                              {it.orderStatus === "배송완료" && it.productId && (
                                <Link
                                  href={`/product/${it.productId}?review=1#reviews`}
                                  className="badge"
                                  style={{ marginLeft: "auto", background: "var(--gold)", color: "var(--ink)", fontWeight: 800 }}
                                >
                                  ✍️ 리뷰 쓰기
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!isEditing && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>비고</div>
                      <div style={{ fontSize: 13, color: order.note ? "var(--ink)" : "var(--muted)" }}>
                        {order.note || "(없음)"}
                      </div>
                    </div>
                  )}

                  {historyLines.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", marginBottom: 4 }}>수정이력</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {historyLines.map((line, i) => (
                          <div key={i} style={{ fontSize: 12, color: "var(--muted)" }}>{line}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!canEdit && !isEditing && (
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                      입금 확인 후에는 직접 수정할 수 없어요. 변경이 필요하면 카톡으로 문의해주세요.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
