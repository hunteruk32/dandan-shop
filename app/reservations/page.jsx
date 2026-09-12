import { cookies } from "next/headers";
import { getOrders, getProducts, baseItemName } from "@/lib/sheet";
import { verifySessionToken, normalizePhone, SESSION_COOKIE } from "@/lib/auth";
import ReservationSearch from "./ReservationSearch";
import NavIcons from "../NavIcons";

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
      <header className="header">
        <div className="seal"><img src="/brand-icon.png" alt="단단상회" /></div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">내 주문 확인</h1>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <NavIcons />
        </div>
      </header>

      <div className="wrap">
        <div style={{ marginTop: 14 }}>
          <ReservationSearch orders={myOrders} myPhone={myPhone} />
        </div>
      </div>
    </div>
  );
}
