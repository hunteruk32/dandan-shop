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
