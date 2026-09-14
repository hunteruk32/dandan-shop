import { getProducts } from "@/lib/sheet";

export default async function sitemap() {
  const base = "https://www.dandan-shop.co.kr";
  const products = await getProducts();

  const staticPages = ["", "/guide", "/contact", "/terms", "/privacy"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  const productPages = products.map((p) => ({
    url: `${base}/product/${p.id}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...productPages];
}
