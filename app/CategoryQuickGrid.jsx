import Link from "next/link";
import CategoryIcon from "./CategoryIcon";

export default function CategoryQuickGrid({ categories }) {
  return (
    <div className="category-grid">
      {categories.map((c) => (
        <Link key={c} href={`/?category=${encodeURIComponent(c)}#products`} className="category-card">
          <CategoryIcon category={c} color="var(--accent)" />
          <span>{c}</span>
        </Link>
      ))}
    </div>
  );
}
