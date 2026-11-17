import { cancelTossPayment } from "@/lib/toss";

// Apps Script(매입현황 시트)가 토스페이먼츠 결제취소 API를 직접 호출하면, 구글 인프라
// 쪽 IP가 토스의 "허용 국가/IP" 보안 정책(기본값: 대한민국만 허용)에 막힐 수 있다 —
// Vercel은 한국 리전에 고정 배포돼 이 정책을 통과하지만, 구글 쪽 IP는 해외로 잡힐 수
// 있기 때문이다. 그래서 Apps Script가 토스를 직접 호출하지 않고 이 라우트를 거치게
// 한다(CANCEL_PROXY_URL 스크립트 속성 설정 시). 인증은 Apps Script와 Vercel이 이미
// 같은 값으로 맞춰두기로 한 TOSS_SECRET_KEY를 그대로 재사용한다.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const secretKey = String(body.secretKey || "");
  const paymentKey = String(body.paymentKey || "").trim();

  if (!process.env.TOSS_SECRET_KEY || secretKey !== process.env.TOSS_SECRET_KEY) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!paymentKey) {
    return Response.json({ ok: false, error: "paymentKey가 없어요." }, { status: 400 });
  }

  const reason = String(body.reason || "고객 요청");
  const cancelAmount = Number(body.cancelAmount) || undefined;

  try {
    const result = await cancelTossPayment({ paymentKey, reason, cancelAmount });
    return Response.json({ ok: true, result });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 502 });
  }
}
