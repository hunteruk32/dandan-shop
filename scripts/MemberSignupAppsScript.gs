/**
 * 이 코드를 "회원" 구글시트의 확장 프로그램 → Apps Script 에 붙여넣고
 * 웹 앱으로 배포하세요. README.md의 "7단계 — 로그인 시스템 연동" 참고.
 *
 * 회원 시트 헤더가 반드시 이 순서여야 합니다:
 * 전화번호 | 비밀번호해시 | 가입일시
 *
 * 비밀번호는 절대 평문으로 오지 않습니다 — Next.js 서버에서 미리 해시(scrypt)한 값만 받습니다.
 */
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const body = JSON.parse(e.postData.contents);
  const createdAt = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([
    body.phone || "",
    body.passwordHash || "",
    createdAt,
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
