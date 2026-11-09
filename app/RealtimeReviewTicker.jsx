"use client";

import Link from "next/link";

function Stars({ rating }) {
  return (
    <span className="review-ticker-stars">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

// 리뷰 개수가 적어도 세로 루프가 끊기지 않게 충분히 채운 뒤, 전체를 한 번 더 복제해서
// translateY(-50%) 애니메이션이 정확히 한 바퀴(원본 목록 전체)만큼 돌고 이어지게 한다.
function buildLoopItems(reviews) {
  const MIN_ITEMS = 6;
  const base = [...reviews];
  while (base.length < MIN_ITEMS) base.push(...reviews);
  return [...base, ...base];
}

export default function RealtimeReviewTicker({ reviews }) {
  if (!reviews || reviews.length === 0) return null;

  const loopItems = buildLoopItems(reviews);
  const durationSec = Math.max(loopItems.length * 2.2, 16);

  return (
    <div className="review-ticker">
      <div className="review-ticker-head">
        <span className="review-ticker-dot" />
        실시간 구매 후기
      </div>
      <div className="review-ticker-viewport">
        <div
          className="review-ticker-track"
          style={{ animationDuration: `${durationSec}s` }}
        >
          {loopItems.map((r, i) => (
            <Link key={`${r.id}-${i}`} href={`/product/${r.productId}#reviews`} className="review-ticker-item">
              <Stars rating={r.rating} />
              <span className="review-ticker-text">
                <b>{r.productName}</b> — {r.content}
              </span>
              <span className="review-ticker-author">{r.authorName}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
