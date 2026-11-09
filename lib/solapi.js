import crypto from "crypto";

// 솔라피(https://solapi.com) REST API 직접 호출 — SDK 없이 HMAC 서명 방식 인증.
// ⚠️ 이 샌드박스에서는 solapi.com 외부망 접속이 막혀 있어 공식 문서를 직접 열어
// 대조하지 못했다. 공개된 문서/예제를 바탕으로 작성했지만, 실제 배포 환경(Vercel)에서
// 첫 발송을 꼭 테스트해보고 에러가 나면 응답 본문을 그대로 알려달라 — 바로 고칠 수 있다.
const API_BASE = "https://api.solapi.com";

function buildAuthHeader() {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", apiSecret).update(date + salt).digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

async function sendMessage(message) {
  const auth = buildAuthHeader();
  if (!auth) return { ok: false, error: "SOLAPI_API_KEY/SOLAPI_API_SECRET이 설정되지 않았어요." };

  const res = await fetch(`${API_BASE}/messages/v4/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify({ message }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = data?.errorMessage || data?.message || JSON.stringify(data);
    return { ok: false, error: `발송 실패 (HTTP ${res.status}): ${detail}` };
  }
  return { ok: true, data };
}

// KAKAO_PF_ID + KAKAO_ALIMTALK_TEMPLATE_ID가 설정되면 알림톡으로, 아니면 일반 SMS로 보낸다.
// 템플릿 승인 전에는 자동으로 SMS로 나가고, 승인 후 두 값만 채워주면 코드 수정 없이 알림톡으로 바뀐다.
export async function sendOtpMessage(phone, code) {
  const from = process.env.SOLAPI_SENDER_PHONE;
  if (!from) return { ok: false, error: "SOLAPI_SENDER_PHONE이 설정되지 않았어요." };

  const pfId = process.env.KAKAO_PF_ID;
  const templateId = process.env.KAKAO_ALIMTALK_TEMPLATE_ID;
  const varName = process.env.KAKAO_ALIMTALK_VAR_NAME || "인증번호";

  if (pfId && templateId) {
    return sendMessage({
      to: phone,
      from,
      kakaoOptions: {
        pfId,
        templateId,
        variables: { [`#{${varName}}`]: code },
      },
    });
  }

  return sendMessage({
    to: phone,
    from,
    text: `[단단상회] 인증번호는 [${code}]입니다. 5분 이내에 입력해주세요.`,
  });
}
