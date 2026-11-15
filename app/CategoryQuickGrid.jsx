import Link from "next/link";

export default function CategoryQuickGrid({ categories }) {
  return (
    <div className="category-grid">
      {categories.map((c) => (
        <Link key={c} href={`/?category=${encodeURIComponent(c)}#products`} className="category-card">
          {c}
        </Link>
      ))}
    </div>
  );
}
