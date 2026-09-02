"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartLink({ dark = true }) {
  const cart = useCart();
  const count = cart?.count || 0;

  return (
    <Link
      href="/cart"
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: dark ? "var(--bg)" : "var(--ink)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginLeft: "auto",
        flexShrink: 0,
      }}
    >
      🛒 장바구니{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
