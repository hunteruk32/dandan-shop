import { cookies } from "next/headers";
import { getOrders } from "@/lib/sheet";
import { verifySessionToken, normalizePhone, SESSION_COOKIE } from "@/lib/auth";
import ReservationSearch from "./ReservationSearch";
import NavIcons from "../NavIcons";

export default async function ReservationsPage() {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  const myPhone = session?.phone ? normalizePhone(session.phone) : "";

  const myOrders = myPhone
    ? (await getOrders()).filter(
        (o) => normalizePhone(o.senderPhone) === myPhone || normalizePhone(o.recipientPhone) === myPhone
      )
    : [];

  return (
    <div>
      <header className="header">
        <div className="seal">단단</div>
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
