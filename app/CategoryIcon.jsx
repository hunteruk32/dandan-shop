const PATHS = {
  수산물: <><path d="M2 12c3-5 7-8 10-8s7 3 10 8c-3 5-7 8-10 8s-7-3-10-8Z" /><circle cx="15" cy="12" r="1.2" fill="currentColor" stroke="none" /></>,
  농산물: <><path d="M12 21c0-6 3-10 8-12" /><path d="M12 21c0-7-3.5-11-9-13" /><path d="M12 21V9" /></>,
  축산물: <><path d="M4 13c0-4 3.5-8 8-8s8 4 8 8-3 6-8 6-8-2-8-6Z" /><path d="M8 13h8M8 17h8" /></>,
  김치: <><path d="M7 9h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  젓갈: <><path d="M6 8h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" /><path d="M9 8V5h6v3" /></>,
  과일: <><path d="M12 3c2 2 3 4 3 6a3 3 0 0 1-6 0c0-2 1-4 3-6Z" /><path d="M6 12a6 6 0 0 0 12 0c0-3-2-5-6-5s-6 2-6 5Z" /></>,
  가공식품: <><rect x="4" y="8" width="16" height="12" rx="1.5" /><path d="M4 8 12 4l8 4" /><path d="M12 12v8" /></>,
  선물세트: <><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M2 6h20v3H2z" /><path d="M12 6v14" /><path d="M12 6c-1.5-3-5-3.5-5-1s3 1.5 5 1Z" /><path d="M12 6c1.5-3 5-3.5 5-1s-3 1.5-5 1Z" /></>,
  기타: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
};

export default function CategoryIcon({ category, size = 26, color = "currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8">
      {PATHS[category] || PATHS["기타"]}
    </svg>
  );
}
