import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/adminAuth";
import { getPendingPurchaseOrders, markPurchaseOrdered } from "@/lib/purchaseOrders";
import { generateSupplierOrderExcel, isSupportedSupplier } from "@/lib/excelOrderForms";

export async function GET(req) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(token)) {
    return Response.json({ ok: false, error: "권한이 없어요." }, { status: 401 });
  }

  const supplier = new URL(req.url).searchParams.get("supplier") || "";
  if (!isSupportedSupplier(supplier)) {
    return Response.json({ ok: false, error: "지원하지 않는 매입처예요." }, { status: 400 });
  }

  const grouped = await getPendingPurchaseOrders();
  const items = grouped[supplier] || [];
  if (items.length === 0) {
    return Response.json({ ok: false, error: "발주 대기 중인 주문이 없어요." }, { status: 400 });
  }

  const { buffer, fileName } = await generateSupplierOrderExcel(supplier, items);
  await markPurchaseOrdered(items, "excel");

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
    },
  });
}
