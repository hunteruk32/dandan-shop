"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useCart } from "../CartProvider";
import PageTitleRow from "../PageTitleRow";
import TrustBadges from "../TrustBadges";
import AddressSearchField, { combineAddress } from "../AddressSearchField";
import TossPaymentWidget from "./TossPaymentWidget";
import { isCardPaymentAllowed } from "@/lib/cardPayment";
import { REWARD_USE_THRESHOLD, pointsEligibleAmount } from "@/lib/rewardPoints";
import { buildLineItems } from "@/lib/orderLineItems";
import { resolveShippingFees } from "@/lib/shipping";
import { isBenefitExcludedProduct } from "@/lib/benefitExclusions";
import { trackPurchase } from "@/lib/gtag";

export default function CheckoutForm() {
  const cart = useCart();
  const [phone, setPhone] = useState(undefined); // undefined = checking, null = logged out
  const [rewardPoints, setRewardPoints] = useState(0);
  const [usedPointsInput, setUsedPointsInput] = useState("");
  const [form, setForm] = useState({
    senderPhone: "",
    senderName: "",
    senderAddressBase: "",
    senderAddressDetail: "",
    recipientName: "",
    recipientPhone: "",
    recipientAddressBase: "",
    recipientAddressDetail: "",
    sameAsSender: false,
    note: "",
  });
  const [state, setState] = useState("idle"); // idle | submitting | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [orderId, setOrderId] = useState("");
  const [orderTotal, setOrderTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("bank"); // bank | card
  const [showCardNotice, setShowCardNotice] = useState(false);
  const [showRewardNotice, setShowRewardNotice] = useState(false);
  const requestTossPaymentRef = useRef(null);
  const cardPaymentEnabled = isCardPaymentAllowed(phone || form.senderPhone);

  const pointsBase = cart?.items?.length
    ? pointsEligibleAmount(buildLineItems(resolveShippingFees(cart.items)).lineItems)
    : 0;
  const hasExcludedItem = (cart?.items || []).some((it) => isBenefitExcludedProduct(it.productId));
  const usedPoints = Math.min(Math.max(0, Number(usedPointsInput) || 0), rewardPoints, pointsBase);
  const payableTotal = (cart?.total || 0) - usedPoints;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data.phone) {
          // 비회원도 주문은 가능하다 — 로그인은 적립금 등 회원 혜택을 쓰고 싶을 때만 필요하다.
          setPhone(null);
        } else {
          setPhone(data.phone);
          setRewardPoints(data.rewardPoints || 0);
          setShowRewardNotice(true);
        }
      });
  }, []);

  // 로그인했으면 세션 전화번호, 비회원이면 직접 입력한 전화번호.
  const contactPhone = phone || form.senderPhone.trim();

  // 이전에 주문한 적 있으면 발송인 성함·주소를 자동으로 채워준다 (수취인은 매번 다를 수 있어 제외).
  useEffect(() => {
    if (!phone) return;
    fetch("/api/checkout/prefill")
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) return;
        setForm((f) => ({
          ...f,
          senderName: f.senderName || data.senderName,
          senderAddressBase: f.senderAddressBase || data.senderAddress,
        }));
      })
      .catch(() => {});
  }, [phone]);

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
      recipientPhone: checked ? contactPhone || "" : "",
      recipientAddressBase: checked ? f.senderAddressBase : "",
      recipientAddressDetail: checked ? f.senderAddressDetail : "",
    }));
  };

  const senderAddress = combineAddress(form.senderAddressBase, form.senderAddressDetail);
  const recipientAddress = combineAddress(form.recipientAddressBase, form.recipientAddressDetail);

  const requiredFilled =
    (phone || form.senderPhone.trim().length >= 9) &&
    form.senderName.trim() &&
    senderAddress &&
    form.recipientName.trim() &&
    form.recipientPhone.trim() &&
    recipientAddress;

  const createOrder = async () => {
    const res = await fetch("/api/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderPhone: phone ? undefined : form.senderPhone.trim(),
        senderName: form.senderName.trim(),
        senderAddress,
        recipientName: form.recipientName.trim(),
        recipientPhone: form.recipientPhone.trim(),
        recipientAddress,
        note: form.note.trim(),
        items: cart.items,
        paymentMethod,
        usedPoints,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || "실패");
    return { orderId: data.orderId || "", totalAmount: data.totalAmount || cart.total };
  };

  const submitBankTransfer = async () => {
    const { orderId: finalOrderId, totalAmount: finalTotal } = await createOrder();
    setOrderId(finalOrderId);
    setOrderTotal(finalTotal);
    cart.clear();
    setState("done");
    trackPurchase({ transactionId: finalOrderId, value: finalTotal });
  };

  const submitCardPayment = async () => {
    if (!requestTossPaymentRef.current) throw new Error("결제창을 아직 불러오는 중이에요. 잠시 후 다시 시도해주세요.");
    const { orderId: finalOrderId } = await createOrder();
    const firstItemName = cart.items[0]?.productName || "상품";
    const orderName = cart.items.length > 1 ? `${firstItemName} 외 ${cart.items.length - 1}건` : firstItemName;
    const origin = window.location.origin;

    // 결제 금액은 TossPaymentWidget이 widgets.setAmount()로 이미 설정해둔 상태라
    // requestPayment()에는 넘기지 않는다 — 여기서 amount를 같이 보내면 SDK가
    // "amount는 정의되지 않은 파라미터입니다" 에러로 거부한다.
    await requestTossPaymentRef.current({
      orderId: finalOrderId,
      orderName,
      customerName: form.senderName.trim(),
      customerMobilePhone: String(contactPhone || "").replace(/[^0-9]/g, ""),
      successUrl: `${origin}/checkout/success`,
      failUrl: `${origin}/checkout/fail`,
    });
    // 성공하면 토스 결제창으로 리다이렉트되어 이 지점 이후 코드는 실행되지 않는다.
  };

  const submit = async () => {
    if (!requiredFilled || !cart || cart.items.length === 0) return;
    setState("submitting");
    setErrorMsg("");
    try {
      if (paymentMethod === "card") {
        await submitCardPayment();
      } else {
        await submitBankTransfer();
      }
    } catch (err) {
      setState("error");
      setErrorMsg(err.message || "주문 접수 중 오류가 발생했어요.");
    }
  };

  if (!cart || phone === undefined) return null;

  if (state !== "done" && cart.items.length === 0) {
    return (
      <div className="wrap">
        <p style={{ marginTop: 40 }}>장바구니가 비어있어요.</p>
        <Link href="/" className="btn" style={{ display: "inline-block", marginTop: 12 }}>
          상품 보러가기
        </Link>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="wrap">
        <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 8, marginTop: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>주문 접수 완료 ✅</div>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            아래 계좌로 입금해주시면 확인 후 상태가 &quot;입금확인&quot;으로 바뀝니다.
            {orderId && (
              <>
                {" "}
                주문번호 <b>{orderId}</b>로 &quot;내 주문 확인&quot;에서 진행 상황을 조회할 수 있어요.
              </>
            )}
          </p>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.8 }}>
            <div>입금은행: <b>{bankName}</b></div>
            <div>계좌번호: <b>{bankAccount}</b></div>
            <div>예금주: <b>{bankHolder}</b></div>
            <div>입금자명: <b>{form.senderName}</b> (발송인과 동일하게 입금해주세요)</div>
            <div>입금액: <b style={{ color: "var(--spice)" }}>{orderTotal.toLocaleString()}원</b></div>
          </div>
        </div>
        <Link href="/" className="btn" style={{ display: "block", textAlign: "center", marginTop: 16 }}>
          상품 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="wrap">
      <PageTitleRow title="주문서 작성" />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {cart.items.map((i) => (
            <div key={i.key} className="card" style={{ justifyContent: "space-between", padding: "10px 14px", gap: 10 }}>
              <span style={{ fontSize: 13, flex: "1 1 auto", minWidth: 0 }}>
                {i.productName}
                {i.optionName ? ` (${i.optionName})` : ""}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={() => cart.updateQty(i.key, i.qty - 1)}
                    disabled={i.qty <= 1}
                    aria-label="수량 줄이기"
                    style={{
                      width: 24, height: 24, borderRadius: 8, border: "1px solid var(--line)",
                      background: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1,
                      color: "var(--ink)", cursor: i.qty <= 1 ? "default" : "pointer",
                      opacity: i.qty <= 1 ? 0.4 : 1,
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: 18, textAlign: "center", fontSize: 13 }}>{i.qty}</span>
                  <button
                    type="button"
                    onClick={() => cart.updateQty(i.key, i.qty + 1)}
                    aria-label="수량 늘리기"
                    style={{
                      width: 24, height: 24, borderRadius: 8, border: "1px solid var(--line)",
                      background: "#fff", fontSize: 14, fontWeight: 700, lineHeight: 1,
                      color: "var(--ink)", cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{(i.price * i.qty).toLocaleString()}원</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 8 }}>발송인(주문자) 정보</div>

        {!phone && (
          <p style={{ fontSize: 12, color: "var(--muted)", margin: "-4px 0 2px" }}>
            비회원도 주문할 수 있어요.
            {pointsBase > 0 && (
              <>
                {" "}
                로그인하면 계좌이체 적립금 혜택을 받을 수 있어요 —{" "}
                <Link href={`/login?next=/checkout`} style={{ color: "var(--accent)", fontWeight: 700 }}>
                  로그인하기
                </Link>
              </>
            )}
          </p>
        )}

        <label style={{ fontSize: 13, fontWeight: 700 }}>발송인 전화번호{phone ? " (로그인 계정)" : ""}</label>
        {phone ? (
          <div className="input" style={{ background: "var(--line)", color: "var(--muted)" }}>{phone}</div>
        ) : (
          <input
            className="input"
            value={form.senderPhone}
            onChange={update("senderPhone")}
            placeholder="010-0000-0000"
          />
        )}
        <label style={{ fontSize: 13, fontWeight: 700 }}>발송인 성함</label>
        <input className="input" value={form.senderName} onChange={update("senderName")} placeholder="입금자명과 동일하게 적어주세요" />
        <label style={{ fontSize: 13, fontWeight: 700 }}>발송인 주소</label>
        <AddressSearchField
          base={form.senderAddressBase}
          detail={form.senderAddressDetail}
          onBaseChange={(v) => setForm((f) => ({ ...f, senderAddressBase: v }))}
          onDetailChange={(v) => setForm((f) => ({ ...f, senderAddressDetail: v }))}
        />

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
        <AddressSearchField
          base={form.recipientAddressBase}
          detail={form.recipientAddressDetail}
          onBaseChange={(v) => setForm((f) => ({ ...f, recipientAddressBase: v }))}
          onDetailChange={(v) => setForm((f) => ({ ...f, recipientAddressDetail: v }))}
          disabled={form.sameAsSender}
        />

        <label style={{ fontSize: 13, fontWeight: 700, marginTop: 8 }}>비고 (선택)</label>
        <textarea
          className="input"
          value={form.note}
          onChange={update("note")}
          placeholder="배송/포장 관련 요청사항이 있으면 적어주세요"
          rows={3}
          style={{ resize: "vertical" }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 10, fontSize: 13, color: "var(--muted)" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>상품금액</span>
            <span>{cart.subtotal.toLocaleString()}원</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>배송비</span>
            <span>{cart.shippingTotal.toLocaleString()}원</span>
          </div>
        </div>

        {rewardPoints >= REWARD_USE_THRESHOLD && pointsBase > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700 }}>적립금 사용 (보유: {rewardPoints.toLocaleString()}원)</label>
            <input
              className="input"
              type="number"
              min="0"
              max={Math.min(rewardPoints, pointsBase)}
              value={usedPointsInput}
              onChange={(e) => setUsedPointsInput(e.target.value)}
              placeholder="사용할 적립금을 입력하세요"
            />
          </div>
        )}

        {usedPoints > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--accent)" }}>
            <span>적립금 사용</span>
            <span>-{usedPoints.toLocaleString()}원</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, marginTop: 4 }}>
          <span>총 결제금액</span>
          <span style={{ color: "var(--spice)" }}>{payableTotal.toLocaleString()}원</span>
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, marginTop: 8 }}>결제 방법</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`tab ${paymentMethod === "bank" ? "active" : ""}`}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => setPaymentMethod("bank")}
          >
            계좌이체
          </button>
          <button
            type="button"
            className={`tab ${paymentMethod === "card" ? "active" : ""}`}
            style={{ flex: 1, padding: "10px 0" }}
            onClick={() => (cardPaymentEnabled ? setPaymentMethod("card") : setShowCardNotice(true))}
          >
            카드결제{!cardPaymentEnabled && " (준비중)"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: hasExcludedItem ? "var(--muted)" : "var(--accent)", margin: 0 }}>
          {pointsBase <= 0
            ? "이 주문 상품은 적립금 적립·사용 대상이 아니에요."
            : hasExcludedItem
              ? "적립 제외 상품에는 적립금이 쌓이지 않고 사용할 수도 없어요. 나머지 금액은 계좌이체 구매확정 시 1%가 적립돼요."
              : "🎁 계좌이체로 주문하면 구매확정 시 결제금액의 1%가 적립금으로 쌓여요 (1000원 이상 적립시 다음주문에서 사용가능)"}
        </p>
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
          💡 계좌이체 시 비고에 남겨주시면 사업자지출증빙 또는 현금영수증 발급해드려요
        </p>

        {showCardNotice && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 20,
            }}
            onClick={() => setShowCardNotice(false)}
          >
            <div
              className="card"
              style={{ flexDirection: "column", alignItems: "flex-start", gap: 10, maxWidth: 320, background: "#fff", padding: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: 800, fontSize: 15 }}>카드결제 준비 중이에요</div>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                현재 PG사(결제대행사) 계약 심사가 진행 중이라, 지금은 계좌이체로만 주문이 가능해요. 양해 부탁드립니다.
              </p>
              <button className="btn" style={{ width: "100%" }} onClick={() => setShowCardNotice(false)}>
                확인
              </button>
            </div>
          </div>
        )}

        {showRewardNotice && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 50,
              padding: 20,
            }}
            onClick={() => setShowRewardNotice(false)}
          >
            <div
              className="card"
              style={{ flexDirection: "column", alignItems: "flex-start", gap: 10, maxWidth: 320, background: "#fff", padding: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontWeight: 800, fontSize: 15 }}>🎁 계좌이체 적립 혜택</div>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, lineHeight: 1.6 }}>
                계좌이체로 주문하면 구매확정 시 <b style={{ color: "var(--ink)" }}>결제금액의 1%</b>가 적립돼요.
                <br />
                현재 보유 적립금: <b style={{ color: "var(--spice)" }}>{rewardPoints.toLocaleString()}원</b>
                <br />
                적립금이 <b style={{ color: "var(--ink)" }}>1,000원 이상</b> 쌓이면 다음 주문부터 자유롭게 사용할 수 있어요.
                {hasExcludedItem ? (
                  <>
                    <br />
                    이번 주문에 담긴 적립 제외 상품에는 이 혜택이 적용되지 않아요.
                  </>
                ) : null}
              </p>
              <button className="btn" style={{ width: "100%" }} onClick={() => setShowRewardNotice(false)}>
                확인
              </button>
            </div>
          </div>
        )}

        {paymentMethod === "card" && (
          <TossPaymentWidget
            amount={payableTotal}
            onReady={(requestPayment) => {
              requestTossPaymentRef.current = requestPayment;
            }}
          />
        )}

        {state === "error" && (
          <p style={{ color: "var(--spice)", fontSize: 13 }}>{errorMsg}</p>
        )}

        <div style={{ marginTop: 4 }}>
          <TrustBadges align="left" />
        </div>

        <button className="btn" onClick={submit} disabled={state === "submitting" || !requiredFilled}>
          {state === "submitting" ? "처리 중…" : paymentMethod === "card" ? "결제하기" : "주문 접수하고 계좌번호 받기"}
        </button>
      </div>
    </div>
  );
}
