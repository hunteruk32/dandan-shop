import { getOrderStatusCounts } from "@/lib/sheet";
import { sendTelegramMessage, formatStatusSummary } from "@/lib/telegram";

// 사장님이 "단단상회 주문상태봇"에게 아무 메시지나 보내면 현재 배송 현황으로 답장한다.
// 텔레그램이 보내는 요청인지는 setWebhook 때 등록한 secret_token으로 확인한다
// (README "텔레그램 주문 알림" 참고).
export async function POST(req) {
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (!process.env.TELEGRAM_WEBHOOK_SECRET || secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const update = await req.json().catch(() => ({}));
  const chatId = update?.message?.chat?.id;
  if (!chatId) return Response.json({ ok: true });

  const counts = await getOrderStatusCounts();
  await sendTelegramMessage(formatStatusSummary(counts), chatId);

  return Response.json({ ok: true });
}
