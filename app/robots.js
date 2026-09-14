export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/checkout", "/cart", "/reservations", "/login", "/signup", "/auth"],
    },
    sitemap: "https://www.dandan-shop.co.kr/sitemap.xml",
  };
}
