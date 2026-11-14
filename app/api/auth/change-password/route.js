import { cookies } from "next/headers";
import {
  getMembers,
  hashPassword,
  verifyPassword,
  verifySessionToken,
  SESSION_COOKIE,
} from "@/lib/auth";

export async function POST(req) {
  const session = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session?.phone) {
    return Response.json({ ok: false, error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (newPassword.length < 4) {
    return Response.json({ ok: false, error: "새 비밀번호는 4자 이상이어야 해요." }, { status: 400 });
  }

  const members = await getMembers();
  const member = members.find((m) => m.phone === session.phone);
  if (!member) {
    return Response.json({ ok: false, error: "회원 정보를 찾을 수 없어요." }, { status: 404 });
  }

  // 소셜 로그인으로만 가입해서 비밀번호가 아직 없는 회원은 현재 비밀번호 확인을 건너뛰고
  // 새 비밀번호를 그대로 설정할 수 있게 한다.
  if (member.passwordHash && !verifyPassword(currentPassword, member.passwordHash)) {
    return Response.json({ ok: false, error: "현재 비밀번호가 올바르지 않아요." }, { status: 401 });
  }

  const url = process.env.MEMBER_SIGNUP_WEBHOOK_URL;
  if (!url) {
    return Response.json(
      { ok: false, error: "회원 연결이 아직 설정되지 않았어요 (MEMBER_SIGNUP_WEBHOOK_URL 없음)." },
      { status: 500 }
    );
  }

  const passwordHash = hashPassword(newPassword);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "resetPassword", phone: session.phone, passwordHash }),
    redirect: "follow",
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    return Response.json(
      { ok: false, error: data?.error || "비밀번호 변경에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
