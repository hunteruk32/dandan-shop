"use client";

import { useState } from "react";

export default function OrderForm({ product }) {
  const [form, setForm] = useState({
    optionIndex: 0,
    qty: 1,
    senderName: "",
    senderPhone: "",
    senderAddress: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddress: "",
    sameAsSender: false,
  });
  const [state, setState] = useState("idle"); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState("");

  const selectedOption = product.options[Number(form.optionIndex)] || null;
  const unitPrice = selectedOption ? selectedOption.price : product.price;
  const subtotal = unitPrice * Number(form.qty || 1);
  const shippingFee = product.shippingFee || 0;
  const total = subtotal + shippingFee;

  const bankName = process.env.NEXT_PUBLIC_BANK_NAME || "은행명 미설정";
  const bankAccount = process.env.NEXT_PUBLIC_BANK_ACCOUNT || "계좌번호 미설정";
  const bankHolder = process.env.NEXT_PUBLIC_BANK_HOLDER || "예금주 미설정";

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const toggleSameAsSender = (e) => {
    const checked = e.target.checked;
    setForm((f) => ({
      ...f,
      sameAsSender: checked,
      recipientName: checked ? f.senderName : "",
      recipientPhone: checked ? f.senderPhone : "",
      recipientAddress: checked ? f.senderAddress : "",
    }));
  };

  const requiredFilled =
    form.senderName.trim() &&
    form.senderPhone.trim() &&
    form.senderAddress.trim() &&
    form.recipientName.trim() &&
    form.recipientPhone.trim() &&
    form.recipientAddress.trim();

  const submit = async () => {
    if (!requiredFilled) return;
    setState("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: form.senderName.trim(),
          senderPhone: form.senderPhone.trim(),
          senderAddress: form.senderAddress.trim(),
          recipientName: form.recipientName.trim(),
          recipientPhone: form.recipientPhone.trim(),
          recipientAddress: form.recipientAddress.trim(),
          category: product.category,
          item: `${product.name}${selectedOption ? ` (${selectedOption.name})` : ""} x${form.qty}`,
          qty: Number(form.qty || 1),
          price: unitPrice,
          shippingFee,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "실패");
      setOrderId(data.orderId || "");
      setState("done");
    } catch (err) {
      setState("error");
      setErrorMsg(err.message || "주문 접수 중 오류가 발생했어요.");
    }
  };

  if (state === "done") {
    return (
      <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>주문 접수 완료 ✅</div>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
          아래 계좌로 입금해주시면 확인 후 상태가 &quot;입금확인&quot;으로 바뀝니다.
          {orderId && (
            <>
              {" "}
              주문번호 <b>{orderId}</b>로 &quot;내 예약 확인&quot;에서 진행 상황을 조회할 수 있어요.
            </>
          )}
        </p>
        <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.8 }}>
          <div>입금은행: <b>{bankName}</b></div>
          <div>계좌번호: <b>{bankAccount}</b></div>
          <div>예금주: <b>{bankHolder}</b></div>
          <div>입금자명: <b>{form.senderName}</b> (발송인과 동일하게 입금해주세요)</div>
          <div>입금액: <b style={{ color: "var(--spice)" }}>{total.toLocaleString()}원</b></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{product.category}</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{product.name}</div>
        <div className="price">{unitPrice.toLocaleString()}원 / 1개</div>
      </div>

      {product.options.length > 0 && (
        <>
          <label style={{ fontSize: 13, fontWeight: 700 }}>옵션</label>
          <select className="input" value={form.optionIndex} onChange={update("optionIndex")}>
            {product.options.map((o, i) => (
              <option key={i} value={i}>
                {o.name} — {o.price.toLocaleString()}원
              </option>
            ))}
          </select>
        </>
      )}

      <label style={{ fontSize: 13, fontWeight: 700 }}>수량</label>
      <input className="input" type="number" min="1" value={form.qty} onChange={update("qty")} />

      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 8 }}>발송인(주문자) 정보</div>
      <label style={{ fontSize: 13, fontWeight: 700 }}>발송인 성함</label>
      <input className="input" value={form.senderName} onChange={update("senderName")} placeholder="입금자명과 동일하게 적어주세요" />
      <label style={{ fontSize: 13, fontWeight: 700 }}>발송인 전화번호</label>
      <input className="input" value={form.senderPhone} onChange={update("senderPhone")} placeholder="010-0000-0000" />
      <label style={{ fontSize: 13, fontWeight: 700 }}>발송인 주소</label>
      <input className="input" value={form.senderAddress} onChange={update("senderAddress")} placeholder="주소를 입력해주세요" />

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
        <input type="checkbox" id="sameAsSender" checked={form.sameAsSender} onChange={toggleSameAsSender} />
        <label htmlFor="sameAsSender" style={{ fontSize: 13 }}>수취인이 발송인과 동일해요</label>
      </div>

      <div style={{ fontSize: 13, fontWeight: 800, marginTop: 8 }}>수취인(받는 분) 정보</div>
      <label style={{ fontSize: 13, fontWeight: 700 }}>수취인 성함</label>
      <input className="input" value={form.recipientName} onChange={update("recipientName")} disabled={form.sameAsSender} placeholder="실제 받으실 분 성함" />
      <label style={{ fontSize: 13, fontWeight: 700 }}>수취인 전화번호</label>
      <input className="input" value={form.recipientPhone} onChange={update("recipientPhone")} disabled={form.sameAsSender} placeholder="010-0000-0000" />
      <label style={{ fontSize: 13, fontWeight: 700 }}>수취인 주소</label>
      <input className="input" value={form.recipientAddress} onChange={update("recipientAddress")} disabled={form.sameAsSender} placeholder="배송받으실 주소" />

      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>상품금액</span>
          <span>{subtotal.toLocaleString()}원</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>배송비</span>
          <span>{shippingFee.toLocaleString()}원</span>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, marginTop: 4 }}>
        <span>총 결제금액</span>
        <span style={{ color: "var(--spice)" }}>{total.toLocaleString()}원</span>
      </div>

      {state === "error" && (
        <p style={{ color: "var(--spice)", fontSize: 13 }}>{errorMsg}</p>
      )}

      <button className="btn" onClick={submit} disabled={state === "submitting" || !requiredFilled}>
        {state === "submitting" ? "접수 중…" : "주문 접수하고 계좌번호 받기"}
      </button>
    </div>
  );
}
