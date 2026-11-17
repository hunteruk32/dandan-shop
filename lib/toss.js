// 토스페이먼츠 결제 승인 API 서버 호출. 시크릿 키는 절대 클라이언트로 내려가지 않는다.
export async function confirmTossPayment({ paymentKey, orderId, amount }) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("결제 연동이 아직 설정되지 않았어요 (TOSS_SECRET_KEY 없음).");

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || "결제 승인에 실패했어요.");
  }
  return data;
}

// 토스페이먼츠 결제취소 API 서버 호출. Apps Script(매입현황 시트)가 토스 API를 직접
// 호출하면 구글 인프라 쪽 IP가 토스의 "허용 국가/IP" 보안 정책(기본값: 대한민국만 허용)에
// 막힐 수 있어서(Vercel은 한국 리전에 고정 배포돼 이 정책을 통과함), Apps Script 대신
// app/api/payment/cancel 라우트가 이 함수로 취소를 대행한다.
export async function cancelTossPayment({ paymentKey, reason, cancelAmount }) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error("결제 연동이 아직 설정되지 않았어요 (TOSS_SECRET_KEY 없음).");

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const payload = { cancelReason: reason || "고객 요청" };
  if (cancelAmount) payload.cancelAmount = cancelAmount;

  const res = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // 이미 취소된 결제는 토스 쪽엔 반영됐는데 우리만 놓친 경우 — 실패가 아니라 성공으로 취급한다.
    if (data.code === "ALREADY_CANCELED_PAYMENT") return data;
    throw new Error(data.message || "결제취소에 실패했어요.");
  }
  return data;
}
