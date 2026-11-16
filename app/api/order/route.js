import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { verifySessionToken, SESSION_COOKIE, getMembers, normalizePhone } from "@/lib/auth";
import { resolveShippingFees } from "@/lib/shipping";
import { buildLineItems } from "@/lib/orderLineItems";
import { resolveUsablePoints, applyRewardDiscount, pointsEligibleAmount } from "@/lib/rewardPoints";
import { UTM_SOURCE_COOKIE } from "@/lib/constants";
import { sql } from "@/lib/db";
import { isCardPaymentAllowed } from "@/lib/cardPayment";
import { getProducts } from "@/lib/sheet";

const REQUIRED_FIELDS = ["senderName", "senderAddress", "recipientName", "recipientPhone", "recipientAddress"];

export async function POST(req) {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  const body = await req.json();

  // 비회원 주문: 로그인 세션이 없으면 주문서에 직접 입력한 전화번호를 쓴다.
  // 로그인 세션이 있으면 (스푸핑 방지를 위해) 항상 세션의 전화번호를 쓰고, 입력값은 무시한다.
  const guestPhone = normalizePhone(body.senderPhone);
  const senderPhone = session?.phone || guestPhone;
  if (!senderPhone || senderPhone.length < 9) {
    return Response.json({ ok: false, error: "발송인 전화번호를 정확히 입력해주세요." }, { status: 400 });
  }

  if (!isCardPaymentAllowed(senderPhone)) {
    return Response.json({ ok: false, error: "결제 시스템 점검 중이에요. 잠시 후 다시 시도해주세요." }, { status: 403 });
  }

  for (const key of REQUIRED_FIELDS) {
    if (!String(body[key] || "").trim()) {
      return Response.json({ ok: false, error: "필수 항목이 비어있어요." }, { status: 400 });
    }
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return Response.json({ ok: false, error: "주문할 상품이 없어요." }, { status: 400 });
  }

  // 클라이언트가 품절·시즌종료 상품을 끼워 보내는 경우를 막기 위해 서버에서도 현재 상태를 다시 확인한다.
  const products = await getProducts();
  const statusById = new Map(products.map((p) => [p.id, p.status]));
  const blocked = items.find((it) => it.productId && statusById.get(it.productId) !== "주문가능");
  if (blocked) {
    return Response.json({ ok: false, error: `${blocked.productName || "상품"}은(는) 지금 주문할 수 없어요.` }, { status: 409 });
  }

  const resolvedItems = resolveShippingFees(items);

  // 적립금은 로그인된(본인 확인된) 회원만 쓸 수 있다 — 비회원 주문에서 남의 전화번호를
  // 입력해 적립금을 훔쳐 쓰는 걸 막기 위해, 세션이 없으면 적립금 조회/사용 자체를 건너뛴다.
  let usedPoints = 0;
  const built = buildLineItems(resolvedItems);
  if (session?.phone) {
    const members = await getMembers();
    const availablePoints = members.find((m) => m.phone === session.phone)?.rewardPoints || 0;
    // 적립 제외 상품(미끼 상품) 금액에는 적립금을 쓸 수 없다.
    usedPoints = resolveUsablePoints(availablePoints, body.usedPoints, pointsEligibleAmount(built.lineItems));
  }

  const utmSource = cookies().get(UTM_SOURCE_COOKIE)?.value || "";

  const senderInfo = {
    senderName: String(body.senderName).trim(),
    senderPhone,
    senderAddress: String(body.senderAddress).trim(),
    recipientName: String(body.recipientName).trim(),
    recipientPhone: String(body.recipientPhone).trim(),
    recipientAddress: String(body.recipientAddress).trim(),
    note: String(body.note || "").trim(),
    utmSource,
  };

  // 카드결제는 실제 승인이 끝난 뒤에만 매입현황시트에 주문을 만든다 — 지금은 토스 결제창에
  // 넘길 임시 토큰만 발급해서 주문에 필요한 정보(resolvedItems — productId가 남아있어야
  // 나중에 분석 이벤트도 기록할 수 있다)를 잠깐 저장해두고, 승인되면
  // /api/payment/confirm이 이 내용으로 주문을 생성한다. (결제창을 닫고 나가거나
  // 실패해도 시트에 "결제 안 한 주문"이 안 남게 하기 위함)
  const priced = applyRewardDiscount(built.lineItems, built.totalAmount, usedPoints);
  const totalAmount = priced.totalAmount;
  const token = "card_" + randomUUID().replace(/-/g, "");
  const pendingPayload = { ...senderInfo, resolvedItems, usedPoints: priced.usedPoints };
  await sql`
    INSERT INTO pending_card_orders (token, payload)
    VALUES (${token}, ${JSON.stringify(pendingPayload)}::jsonb)
  `;
  return Response.json({ ok: true, totalAmount, orderId: token });
}
