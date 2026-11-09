import { getMembers, normalizePhone } from "@/lib/auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const phone = normalizePhone(searchParams.get("phone"));
  if (phone.length < 9) return Response.json({ ok: true, exists: false });

  const members = await getMembers();
  const exists = members.some((m) => m.phone === phone);
  return Response.json({ ok: true, exists });
}
