import { cookies } from "next/headers";
import { getOrders, getProducts, baseItemName } from "@/lib/sheet";
import { verifySessionToken, normalizePhone, SESSION_COOKIE } from "@/lib/auth";
import ReservationSearch from "./ReservationSearch";
import SiteHeader from "../SiteHeader";
import PageTitleRow from "../PageTitleRow";

export default async function ReservationsPage() {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  const myPhone = session?.phone ? normalizePhone(session.phone) : "";

  const [orders, products] = await Promise.all([
    myPhone ? getOrders() : Promise.resolve([]),
    myPhone ? getProducts() : Promise.resolve([]),
  ]);
  const nameToId = new Map(products.map((p) => [p.name, p.id]));

  const myOrders = myPhone
    ? orders
        .filter((o) => normalizePhone(o.senderPhone) === myPhone || normalizePhone(o.recipientPhone) === myPhone)
        .map((o) => ({ ...o, productId: nameToId.get(baseItemName(o.item)) || null }))
    : [];

  return (
    <div>
      <SiteHeader />

      <div className="wrap">
        <PageTitleRow title="내 주문 확인" />
        <ReservationSearch orders={myOrders} myPhone={myPhone} />
      </div>
    </div>
  );
}
