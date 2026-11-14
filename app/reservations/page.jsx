import { redirect } from "next/navigation";

// "내 주문 확인"은 마이페이지(/mypage)로 통합됐다. 예전 북마크/검색엔진 색인으로
// 들어오는 경우를 위해 그대로 리다이렉트만 해준다.
export default function ReservationsPage() {
  redirect("/mypage");
}
