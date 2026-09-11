const ITEMS = [
  {
    label: "전국 협력 산지 직송",
    icon: <><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" /></>,
  },
  {
    label: "당일 수급 · 당일 발송",
    icon: <><rect x="1" y="7" width="15" height="10" rx="1.5" /><path d="M16 10h4l3 3v4h-7z" /><circle cx="6" cy="19" r="1.6" /><circle cx="18.5" cy="19" r="1.6" /></>,
  },
  {
    label: "검증된 협력사만 등록",
    icon: <><path d="M12 2 4 5v6c0 5 3.4 8.7 8 11 4.6-2.3 8-6 8-11V5Z" /><path d="m9 12 2 2 4-4" /></>,
  },
  {
    label: "계좌이체 · 안전결제",
    icon: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  },
];

export default function TrustStrip() {
  return (
    <div className="trust-strip">
      <div className="trust-strip-inner">
        {ITEMS.map((it) => (
          <div key={it.label} className="trust-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2">
              {it.icon}
            </svg>
            {it.label}
          </div>
        ))}
      </div>
    </div>
  );
}
