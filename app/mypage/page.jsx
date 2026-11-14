import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOrders, getProducts, baseItemName } from "@/lib/sheet";
import { verifySessionToken, normalizePhone, SESSION_COOKIE, getMembers } from "@/lib/auth";
import { REWARD_USE_THRESHOLD } from "@/lib/rewardPoints";
import ReservationSearch from "../reservations/ReservationSearch";
import ChangePasswordForm from "./ChangePasswordForm";
import SiteHeader from "../SiteHeader";
import PageTitleRow from "../PageTitleRow";

export default async function MyPage() {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  const myPhone = session?.phone ? normalizePhone(session.phone) : "";

  if (!myPhone) {
    redirect("/login?next=/mypage");
  }

  const [orders, products, members] = await Promise.all([
    getOrders(),
    getProducts(),
    getMembers().catch(() => []),
  ]);
  const nameToId = new Map(products.map((p) => [p.name, p.id]));

  const myOrders = orders
    .filter((o) => normalizePhone(o.senderPhone) === myPhone || normalizePhone(o.recipientPhone) === myPhone)
    .map((o) => ({ ...o, productId: nameToId.get(baseItemName(o.item)) || null }));

  const member = members.find((m) => m.phone === myPhone);
  const rewardPoints = member?.rewardPoints || 0;
  const hasPassword = !!member?.passwordHash;

  return (
    <div>
      <SiteHeader />

      <div className="wrap">
        <PageTitleRow title="마이페이지" />

        <div className="card" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{myPhone}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)" }}>
            적립금 {rewardPoints.toLocaleString()}원
          </div>
          {rewardPoints < REWARD_USE_THRESHOLD && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              {REWARD_USE_THRESHOLD.toLocaleString()}원 이상 쌓이면 주문 시 사용할 수 있어요.
            </div>
          )}
        </div>

        <ChangePasswordForm hasPassword={hasPassword} />

        <div style={{ marginTop: 28, marginBottom: 10, fontSize: 15, fontWeight: 800 }}>내 주문</div>
        <ReservationSearch orders={myOrders} myPhone={myPhone} />
      </div>
    </div>
  );
}
