import { hashPassword, normalizePhone } from "@/lib/auth";
import { verifyOtp } from "@/lib/otp";

const PURPOSE = "reset_password";

export async function POST(req) {
  const body = await req.json();
  const phone = normalizePhone(body.phone);
  const code = String(body.code || "").trim();
  const newPassword = String(body.newPassword || "");

  if (phone.length < 9) {
    return Response.json({ ok: false, error: "전화번호를 정확히 입력해주세요." }, { status: 400 });
  }
  if (newPassword.length < 4) {
    return Response.json({ ok: false, error: "비밀번호는 4자 이상이어야 해요." }, { status: 400 });
  }

  const result = await verifyOtp(phone, PURPOSE, code);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
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
    body: JSON.stringify({ action: "resetPassword", phone, passwordHash }),
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
