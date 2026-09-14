import Link from "next/link";
import { getPendingPurchaseOrders } from "@/lib/purchaseOrders";
import { isSupportedSupplier } from "@/lib/excelOrderForms";

export const dynamic = "force-dynamic";

function SupplierGroup({ supplier, items }) {
  const downloadable = isSupportedSupplier(supplier);
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>
          {supplier} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 13 }}>· {items.length}건</span>
        </div>
        {downloadable ? (
          <a href={`/api/admin/purchase-orders/excel?supplier=${encodeURIComponent(supplier)}`} className="btn" style={{ fontSize: 13, padding: "8px 14px" }}>
            발주서 다운로드 (엑셀)
          </a>
        ) : (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>상품코드 매칭 확인 후 자동발주 연결 예정</span>
        )}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F6F4EE", textAlign: "left" }}>
              <th style={{ padding: "8px 14px" }}>주문번호</th>
              <th style={{ padding: "8px 14px" }}>품목</th>
              <th style={{ padding: "8px 14px", textAlign: "right" }}>수량</th>
              <th style={{ padding: "8px 14px" }}>수취인</th>
              <th style={{ padding: "8px 14px" }}>수취인 주소</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={`${it.orderId}-${i}`} style={{ borderTop: "1px solid var(--line)" }}>
                <td style={{ padding: "8px 14px", color: "var(--muted)" }}>{it.orderId}</td>
                <td style={{ padding: "8px 14px", fontWeight: 700 }}>{it.itemName}</td>
                <td style={{ padding: "8px 14px", textAlign: "right" }}>{it.qty}</td>
                <td style={{ padding: "8px 14px" }}>{it.recipientName}</td>
                <td style={{ padding: "8px 14px", color: "var(--muted)" }}>{it.recipientAddress}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function PurchaseOrdersPage() {
  const grouped = await getPendingPurchaseOrders();
  const suppliers = Object.keys(grouped);

  return (
    <div className="wrap" style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 className="serif" style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>오늘의 발주</h1>
        <Link href="/admin" style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>← 대시보드로</Link>
      </div>

      {suppliers.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>발주 대기 중인 주문이 없어요.</p>
      ) : (
        suppliers.map((supplier) => <SupplierGroup key={supplier} supplier={supplier} items={grouped[supplier]} />)
      )}
    </div>
  );
}
