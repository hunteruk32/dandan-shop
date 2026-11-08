// 새 주문 알림 메시지 — 주문 정보 + 현재 배송 현황(statusCounts)을 한 번에 보여준다.
export function formatOrderNotification({ senderName, senderPhone, lineItems, totalAmount, paymentLabel, recipientName, recipientAddress }, statusCounts) {
  const itemLines = lineItems.map((li) => li.item).join("\n");
  const statusLine = statusCounts
    ? `\n\n📦 배송준비중 ${statusCounts.배송준비중}건 / 배송중 ${statusCounts.배송중}건 / 배송완료 ${statusCounts.배송완료}건`
    : "";
  return (
    `🛒 새 주문이 들어왔어요!\n\n` +
    `${senderName}님 (${senderPhone})\n` +
    `${itemLines}\n` +
    `${paymentLabel}\n` +
    `${totalAmount.toLocaleString()}원\n\n` +
    `받는분: ${recipientName}\n${recipientAddress}` +
    statusLine
  );
}

export function formatStatusSummary(statusCounts) {
  return (
    `📦 현재 배송 현황\n\n` +
    `배송준비중 ${statusCounts.배송준비중}건\n` +
    `배송중 ${statusCounts.배송중}건\n` +
    `배송완료 ${statusCounts.배송완료}건`
  );
}

// 주문이 들어올 때마다, 또는 사장님이 봇에게 아무 메시지나 보냈을 때 텔레그램으로 알림을
// 보내는 데 쓰는 최소 래퍼. TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID가 없으면 조용히 아무 것도
// 안 한다(알림 기능은 선택이라, 설정 안 해도 주문 접수 자체엔 영향 없어야 한다).
export async function sendTelegramMessage(text, chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChatId = chatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !targetChatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: targetChatId, text }),
    });
  } catch {
    // 알림 실패해도 주문 접수 자체엔 영향 없음
  }
}
