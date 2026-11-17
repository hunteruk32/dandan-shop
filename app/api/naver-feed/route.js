import { getProducts } from "@/lib/sheet";
import { resolveShippingFees } from "@/lib/shipping";

// 네이버 가격비교 상품 DB(EP, Engine Page) 피드. 네이버 쇼핑파트너센터 > 상품관리 >
// 상품정보 수신현황 > 쇼핑몰 상품 DB URL에 이 라우트 주소를 등록해두면, 네이버가 하루
// 한 번(01시) 이 응답을 읽어가서 가격비교에 반영한다("네이버 가격비교 상품정보연동 포맷
// 제작 가이드" 2~3장 참고). 첫 줄은 헤더, 그 다음부터 상품 한 줄씩 — 반드시 tab 문자로
// 구분해야 하며(TSV), 이 가이드가 "필수"로 못박은 컬럼만 우선 포함했다: id, title,
// price_pc, link, image_link, category_name1, shipping.
const SITE_URL = "https://www.dandan-shop.co.kr";

const COLUMNS = [
  "id",
  "title",
  "price_pc",
  "normal_price",
  "link",
  "mobile_link",
  "image_link",
  "category_name1",
  "category_name2",
  "shipping",
  "option_detail",
];

// 헤더/값 사이는 반드시 tab으로만 구분돼야 하므로(가이드 1.2), 값에 탭이나 줄바꿈이
// 섞여 들어오면 그 줄 전체가 무효 처리된다 — 공백으로 치환해 방지한다.
function tsvField(value) {
  return String(value ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

export async function GET() {
  const products = await getProducts();

  const rows = products
    // 전체EP는 "품절이 아니면서 구매 가능한" 상품만 포함해야 한다(가이드 1.1).
    .filter((p) => p.status === "주문가능")
    .map((p) => {
      const minOption = (p.options || []).find((o) => o.price === p.price);

      // 체크아웃 때 실제로 청구되는 배송비 계산 로직(젓갈 합배송 등)을 그대로 재사용해서,
      // "이 가격+배송비로 실제 구매 가능해야 한다"는 네이버 요구사항을 지킨다.
      const shipping = resolveShippingFees([
        {
          productId: p.id,
          category: p.category,
          qty: 1,
          shippingFee: p.shippingFee,
          weightG: minOption?.weightG || 0,
          combinedShippingQty: p.combinedShippingQty,
        },
      ])[0].resolvedShippingFee;

      const fields = {
        id: p.id,
        title: p.name,
        price_pc: p.price,
        normal_price: p.listPrice > p.price ? p.listPrice : "",
        link: `${SITE_URL}/product/${p.id}`,
        mobile_link: `${SITE_URL}/product/${p.id}`,
        image_link: p.image,
        category_name1: "식품",
        category_name2: p.category || "",
        shipping,
        option_detail: (p.options || []).map((o) => `${o.name}^${o.price}`).join("|"),
      };
      return COLUMNS.map((col) => tsvField(fields[col])).join("\t");
    });

  const body = [COLUMNS.join("\t"), ...rows].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
