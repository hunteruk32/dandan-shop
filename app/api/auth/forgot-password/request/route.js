import { getMembers, normalizePhone } from "@/lib/auth";
import { issueOtp } from "@/lib/otp";
import { sendOtpMessage } from "@/lib/solapi";

const PURPOSE = "reset_password";

export async function POST(req) {
  const body = await req.json();
  const phone = normalizePhone(body.phone);
  if (phone.length < 9) {
    return Response.json({ ok: false, error: "전화번호를 정확히 입력해주세요." }, { status: 400 });
  }

  const members = await getMembers();
  if (!members.some((m) => m.phone === phone)) {
    return Response.json({ ok: false, error: "가입되지 않은 전화번호예요." }, { status: 404 });
  }

  const code = await issueOtp(phone, PURPOSE);
  const sent = await sendOtpMessage(phone, code);
  if (!sent.ok) {
    return Response.json({ ok: false, error: sent.error || "인증번호 발송에 실패했어요." }, { status: 502 });
  }

  return Response.json({ ok: true });
}
