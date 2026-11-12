"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// 헤더에 고정으로 두는 상품 검색. 홈 "지금 구매 가능한 상품" 목록(#products)의
// 검색 조건(?q=)으로 이동만 시키고, 실제 필터링은 ProductBrowser가 한다.
export default function HeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/?q=${encodeURIComponent(q)}#products` : "/#products");
  };

  return (
    <form onSubmit={submit}>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="상품 이름으로 검색"
        className="input"
        style={{ width: "100%" }}
      />
    </form>
  );
}
