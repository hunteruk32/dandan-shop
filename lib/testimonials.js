// 카카오톡 오픈채팅방에서 실제 구매고객이 남긴 후기 (이름은 실제 후기 작성자 보호를 위한 마스킹 표기)
export const TESTIMONIALS = [
  { keywords: ["옥수수"], text: "옥수수 신선하니 맛있어요", author: "김**" },
  {
    keywords: ["찰옥수수", "옥수수"],
    text: "찰옥수수 쫄깃쫄깃하니 맛있습니다. 초당옥수수에 이어 찰옥수수도 품질이 아주 좋네요.",
    author: "이**",
  },
  { keywords: ["장어"], text: "장어 정말 실하네요 ㅎㅎ", author: "박**" },
  {
    keywords: ["젓갈", "낙지"],
    text: "낙지젓갈 완전 추천해요. 적당히 매콤하고 양념 맛있어요. 다리도 통통하니 실합니다.",
    author: "최**",
  },
  { keywords: ["곱창"], text: "소곱창구이!! 넘 맛있어요!!!!", author: "정**" },
  { keywords: ["전어"], text: "전어파티입니다. 생와사비에 쌈장까지 들어있네요.", author: "강**" },
  { keywords: ["꽃게"], text: "꽃게 살 많고 맛있어요 👍👍", author: "조**" },
  { keywords: ["홍어"], text: "이번 주말은 홍어네요, 색 좋아요 ㅎ", author: "윤**" },
  {
    keywords: ["수박"],
    text: "10kg 프리미엄 하우스 수박, 포장 잘되서 왔네요~ 크고 맛도 좋았어요~~",
    author: "장**",
  },
  {
    keywords: ["수박"],
    text: "수박 살짝 잘라서 맛보여 줬더니 애들이 숟가락으로 계속 퍼먹고 있네요. 역시 애들은 달면 잘 먹어요.",
    author: "임**",
  },
  {
    keywords: ["두리안"],
    text: "냉동 두리안 처음 먹어보는데 맛있게 먹었어요. 필리핀산이네요 ^^",
    author: "한**",
  },
  {
    keywords: ["사과", "홍로"],
    text: "홍로 사과 진짜 달고 맛있어요. 오늘도 아침은 껍질째 홍로입니다.",
    author: "오**",
  },
];

export function getTestimonialsFor(product, limit = 2) {
  const haystack = `${product.name} ${product.category}`.toLowerCase();
  return TESTIMONIALS.filter((t) => t.keywords.some((k) => haystack.includes(k.toLowerCase()))).slice(
    0,
    limit
  );
}
