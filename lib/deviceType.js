// User-Agent로 모바일/PC만 구분한다(테블릿도 손에 들고 보는 기기라 모바일로 묶는다).
const MOBILE_UA_RE = /Mobile|Android|iPhone|iPad|iPod|IEMobile|BlackBerry|Opera Mini/i;

export function detectDeviceType(userAgent) {
  return MOBILE_UA_RE.test(String(userAgent || "")) ? "mobile" : "pc";
}
