// 팝업 "오늘 하루 안 보기" 체크박스용 — 체크하고 닫으면 당일(브라우저 로컬 날짜) 안에는 다시 안 뜬다.
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export function isDismissedToday(storageKey) {
  try {
    return localStorage.getItem(storageKey) === todayKey();
  } catch {
    return false;
  }
}

export function dismissForToday(storageKey) {
  try {
    localStorage.setItem(storageKey, todayKey());
  } catch {
    // 저장 실패해도 그냥 닫히게 둔다
  }
}
