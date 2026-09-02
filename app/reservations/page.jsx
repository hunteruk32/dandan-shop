import Link from "next/link";
import { getOrders } from "@/lib/sheet";
import ReservationSearch from "./ReservationSearch";

export const revalidate = 60;

export default async function ReservationsPage() {
  const orders = await getOrders();

  return (
    <div>
      <header className="header">
        <div className="seal">단단</div>
        <div>
          <div className="eyebrow">DIRECT TRADE MARKET</div>
          <h1 className="h1">내 주문 확인</h1>
        </div>
      </header>

      <div className="wrap">
        <Link href="/" style={{ fontSize: 13, color: "var(--muted)" }}>← 상품 목록으로</Link>
        <div style={{ marginTop: 14 }}>
          <ReservationSearch orders={orders} />
        </div>
      </div>
    </div>
  );
}
