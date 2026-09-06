"use client";

import { useEffect, useState } from "react";

const PRODUCT_ASSETS_URL =
  "https://1drv.ms/f/c/0f4b72944f69dbf5/IgDZi5fCjU0xR4BzF0Aczd_WAT3t-uyjZ9QnTlV3zRk300M?e=KGc4Yy";

export default function ProductAssetsLink() {
  const [phone, setPhone] = useState(undefined); // undefined = loading

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setPhone(data.phone))
      .catch(() => setPhone(null));
  }, []);

  if (!phone) return null;

  return (
    <a
      href={PRODUCT_ASSETS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="btn"
      style={{ display: "inline-block", background: "#fff", color: "var(--accent)", border: "1px solid var(--accent)" }}
    >
      🖼️ 상품 이미지 및 상세페이지 바로보기
    </a>
  );
}
