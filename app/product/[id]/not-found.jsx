import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="wrap">
      <p style={{ marginTop: 40 }}>상품을 찾을 수 없어요.</p>
      <Link href="/" className="btn" style={{ display: "inline-block", marginTop: 12 }}>
        목록으로
      </Link>
    </div>
  );
}
