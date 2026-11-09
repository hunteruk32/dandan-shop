import { cookies } from "next/headers";
import { verifySessionToken, SESSION_COOKIE, getMembers } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  if (!session?.phone) return Response.json({ phone: null });

  let rewardPoints = 0;
  try {
    const members = await getMembers();
    rewardPoints = members.find((m) => m.phone === session.phone)?.rewardPoints || 0;
  } catch {
    // 적립금 조회 실패해도 로그인 상태 자체는 정상 응답
  }

  return Response.json({ phone: session.phone, rewardPoints });
}
