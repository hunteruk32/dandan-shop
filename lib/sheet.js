import Papa from "papaparse";

async function fetchCsv(url) {
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true });
  return data;
}

const MAX_OPTIONS = 8;

function parseOptions(r) {
  const options = [];
  for (let i = 1; i <= MAX_OPTIONS; i++) {
    const name = String(r[`option${i}`] || "").trim();
    const price = Number(String(r[`price${i}`] || "0").replace(/[^0-9]/g, "")) || 0;
    if (name && price) options.push({ name, price });
  }
  return options;
}

export async function getProducts() {
  const rows = await fetchCsv(process.env.PRODUCTS_CSV_URL);
  return rows
    .filter((r) => r.id && r.name)
    .map((r) => {
      const options = parseOptions(r);
      return {
        id: String(r.id).trim(),
        date: String(r.date || "").trim(),
        category: String(r.category || "기타").trim(),
        name: String(r.name).trim(),
        options,
        price: options.length ? Math.min(...options.map((o) => o.price)) : 0,
        shippingFee: Number(String(r["shiping fee"] || "0").replace(/[^0-9]/g, "")) || 0,
        status: String(r.status || "주문가능").trim(),
        image: String(r.image || "").trim(),
        description: String(r.description || "").trim(),
      };
    });
}

export async function getProductById(id) {
  const products = await getProducts();
  return products.find((p) => p.id === id) || null;
}

export async function getOrders() {
  const rows = await fetchCsv(process.env.RESERVATIONS_CSV_URL);
  return rows
    .filter((r) => r["아이디"])
    .map((r) => ({
      id: String(r["아이디"] || "").trim(),
      orderedAt: String(r["주문일시"] || "").trim(),
      senderName: String(r["발송인"] || "").trim(),
      senderAddress: String(r["발송인 주소"] || "").trim(),
      senderPhone: String(r["발송인 전화번호"] || "").trim(),
      recipientName: String(r["수취인"] || "").trim(),
      recipientPhone: String(r["수취인 전화번호"] || "").trim(),
      recipientAddress: String(r["수취인 주소"] || "").trim(),
      category: String(r["카테고리"] || "").trim(),
      item: String(r["구매품목"] || "").trim(),
      qty: Number(r["수량"] || 0) || 0,
      price: Number(String(r["구매가격"] || "0").replace(/[^0-9]/g, "")) || 0,
      shippingFee: Number(String(r["배송비"] || "0").replace(/[^0-9]/g, "")) || 0,
      totalAmount: Number(String(r["합계금액"] || "0").replace(/[^0-9]/g, "")) || 0,
      paymentStatus: String(r["결제상태"] || "").trim(),
      orderStatus: String(r["발주 상태"] || "").trim(),
    }));
}

export const CATEGORIES = ["수산물", "농산물", "축산물", "김치", "젓갈", "과일", "가공식품", "기타"];

export const STATUS_STYLE = {
  주문가능: { bg: "#E9F3EC", fg: "#2F6F4E" },
  품절: { bg: "#EFEDE7", fg: "#8A8172" },
  시즌종료: { bg: "#FBEFE6", fg: "#C0511F" },
};
