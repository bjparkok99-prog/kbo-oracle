// 원본 기록(raw-*)을 앱에서 쓰는 JSON으로 변환합니다.
// 사용법: node scripts/build-data.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const D = (f) => path.join(root, "data", f);
const read = (f) => fs.readFileSync(D(f), "utf8").trim().split("\n");

// ── 팀 기본 정보 + 2026 정규시즌 최종 순위 (Daum 스포츠, 2026-10-30 기준)
const TEAMS = [
  // id, 이름, 약칭, 메인컬러, 보조컬러, 홈구장, 순위, 경기, 승, 무, 패, 연속
  ["kt", "KT 위즈", "KT", "#E4002B", "#1A1A1A", "수원 KT위즈파크", 1, 144, 90, 5, 49, "10승"],
  ["samsung", "삼성 라이온즈", "삼성", "#1D6FE0", "#C0C0C0", "대구 삼성라이온즈파크", 2, 144, 83, 3, 58, "4패"],
  ["kia", "KIA 타이거즈", "KIA", "#EA0029", "#06141F", "광주 KIA챔피언스필드", 3, 144, 79, 2, 63, "1승"],
  ["lg", "LG 트윈스", "LG", "#C30452", "#2B2B2B", "잠실야구장", 4, 144, 78, 1, 65, "1패"],
  ["doosan", "두산 베어스", "두산", "#3B3A8F", "#ED1C24", "잠실야구장", 5, 144, 73, 5, 66, "2패"],
  ["ssg", "SSG 랜더스", "SSG", "#CE0E2D", "#FFB81C", "인천 SSG랜더스필드", 6, 144, 65, 5, 74, "1패"],
  ["lotte", "롯데 자이언츠", "롯데", "#0B3B8C", "#D00F31", "부산 사직야구장", 7, 144, 64, 3, 77, "2승"],
  ["nc", "NC 다이노스", "NC", "#3E6FB0", "#C7A079", "창원NC파크", 8, 144, 64, 2, 78, "1승"],
  ["hanwha", "한화 이글스", "한화", "#FF6600", "#1A1A1A", "대전 한화생명볼파크", 9, 144, 57, 4, 83, "2패"],
  ["kiwoom", "키움 히어로즈", "키움", "#A0153E", "#4A4A4A", "고척스카이돔", 10, 144, 50, 4, 90, "1승"],
];
const byShort = Object.fromEntries(TEAMS.map((t) => [t[2], t[0]]));

// ── 팀 타격 (Daum): 타수 안타 2타 3타 홈런 타점 득점 도루 사사구 삼진 병살 타율 출루율 장타율 OPS
const BAT = {
  KT: [5047, 1441, 253, 20, 121, 772, 825, 61, 679, 1094, 104, .286, .367, .415, .783],
  삼성: [4940, 1350, 222, 27, 140, 773, 806, 97, 717, 1017, 104, .273, .362, .414, .776],
  한화: [5074, 1383, 217, 17, 176, 772, 821, 76, 628, 1148, 114, .273, .350, .426, .776],
  롯데: [5044, 1373, 246, 26, 113, 645, 679, 105, 488, 1063, 95, .272, .334, .398, .733],
  KIA: [4962, 1347, 251, 18, 174, 736, 769, 84, 597, 1136, 108, .271, .347, .434, .782],
  NC: [4915, 1326, 221, 10, 134, 681, 719, 154, 622, 1086, 109, .270, .349, .401, .750],
  두산: [4934, 1318, 215, 30, 114, 645, 688, 117, 565, 1003, 108, .267, .339, .392, .731],
  LG: [4834, 1278, 216, 19, 136, 695, 723, 91, 669, 1072, 102, .264, .351, .401, .752],
  SSG: [4935, 1276, 220, 22, 143, 664, 706, 96, 607, 1164, 92, .259, .337, .399, .736],
  키움: [4863, 1185, 198, 13, 115, 533, 565, 23, 585, 1271, 109, .244, .323, .361, .684],
};
// ── 팀 투수 (Daum): 이닝 피안타 피홈런 실점 자책 사사구 탈삼진 평균자책 실책 WHIP QS 홀드 세이브
const PIT = {
  두산: ["1282 2/3", 1259, 121, 630, 550, 551, 1249, 3.86, 103, 1.35, 63, 59, 34],
  KT: ["1292", 1334, 123, 649, 594, 523, 1161, 4.14, 87, 1.38, 67, 86, 33],
  KIA: ["1279 2/3", 1242, 139, 664, 607, 605, 1053, 4.27, 98, 1.39, 50, 91, 29],
  삼성: ["1280", 1304, 138, 669, 613, 548, 1091, 4.31, 85, 1.39, 59, 75, 42],
  롯데: ["1275 2/3", 1365, 128, 742, 669, 595, 1167, 4.72, 107, 1.48, 59, 71, 27],
  NC: ["1270 2/3", 1261, 157, 772, 676, 728, 1139, 4.79, 108, 1.50, 50, 79, 28],
  LG: ["1271 2/3", 1379, 118, 726, 679, 568, 983, 4.81, 89, 1.46, 42, 104, 50],
  SSG: ["1270 1/3", 1298, 159, 797, 729, 722, 1111, 5.16, 85, 1.52, 38, 65, 29],
  한화: ["1270 2/3", 1408, 148, 835, 743, 677, 1052, 5.26, 110, 1.56, 37, 56, 16],
  키움: ["1267 1/3", 1427, 135, 817, 746, 640, 1048, 5.30, 97, 1.56, 38, 60, 29],
};

// ── 상대전적 (kbo-dashboard.co.kr, 2026-10-12 반영) : 행 팀 기준 "승-패-무"
const H2H_ORDER = ["KT", "삼성", "KIA", "LG", "두산", "SSG", "롯데", "NC", "한화", "키움"];
const H2H_ROWS = [
  ["-", "7-9", "10-6", "10-6", "11-4-1", "8-7-1", "10-5-1", "11-5", "12-3-1", "11-4-1"],
  ["9-7", "-", "7-9", "8-8", "7-8-1", "9-7", "8-8", "12-4", "12-3-1", "11-4-1"],
  ["6-10", "9-7", "-", "9-7", "7-9", "11-4-1", "10-5-1", "5-11", "10-6", "12-4"],
  ["6-10", "8-8", "7-9", "-", "11-4-1", "9-7", "9-7", "10-6", "8-8", "10-6"],
  ["4-11-1", "8-7-1", "9-7", "4-11-1", "-", "8-8", "10-6", "12-4", "7-8-1", "11-4-1"],
  ["7-8-1", "7-9", "4-11-1", "7-9", "8-8", "-", "8-7-1", "10-4-2", "6-10", "8-8"],
  ["5-10-1", "8-8", "5-10-1", "7-9", "6-10", "7-8-1", "-", "7-9", "5-11", "14-2"],
  ["5-11", "4-12", "11-5", "6-10", "4-12", "4-10-2", "9-7", "-", "13-3", "8-8"],
  ["3-12-1", "3-12-1", "6-10", "8-8", "8-7-1", "10-6", "11-5", "3-13", "-", "5-10-1"],
  ["4-11-1", "4-11-1", "4-12", "6-10", "4-11-1", "8-8", "2-14", "8-8", "10-5-1", "-"],
];

const ipToNum = (s) => {
  const [w, f] = String(s).split(" ");
  return Number(w) + (f ? Number(f.split("/")[0]) / 3 : 0);
};

// 경기 결과
const games = read("raw-games.csv").map((l, i) => {
  const [d, away, as, home, hs, type] = l.split(",");
  return {
    id: `g${i + 1}`,
    date: `2026-${d.replace(".", "-")}`,
    away: byShort[away],
    home: byShort[home],
    awayScore: Number(as),
    homeScore: Number(hs),
    type, // R 정규, WC 와일드카드, SPO 준PO, PO 플레이오프
  };
});

function recentForm(id) {
  const reg = games.filter((g) => g.type === "R" && (g.home === id || g.away === id));
  const last = reg.slice(-10).reverse();
  return last.map((g) => {
    const my = g.home === id ? g.homeScore : g.awayScore;
    const op = g.home === id ? g.awayScore : g.homeScore;
    return {
      date: g.date,
      opp: g.home === id ? g.away : g.home,
      home: g.home === id,
      score: `${my}-${op}`,
      result: my > op ? "W" : my < op ? "L" : "D",
    };
  });
}

const teams = TEAMS.map(([id, name, short, color, color2, stadium, rank, g, w, d, l, streak]) => {
  const b = BAT[short];
  const p = PIT[short];
  return {
    id, name, short, color, color2, stadium,
    standing: { rank, g, w, d, l, pct: +(w / (w + l)).toFixed(3), gb: 0, streak },
    batting: {
      ab: b[0], h: b[1], d2: b[2], d3: b[3], hr: b[4], rbi: b[5], r: b[6], sb: b[7],
      bb: b[8], so: b[9], gdp: b[10], avg: b[11], obp: b[12], slg: b[13], ops: b[14],
    },
    pitching: {
      ip: p[0], ipNum: +ipToNum(p[0]).toFixed(2), h: p[1], hr: p[2], ra: p[3], er: p[4], bb: p[5],
      so: p[6], era: p[7], e: p[8], whip: p[9], qs: p[10], hld: p[11], sv: p[12],
    },
    recent: recentForm(id),
  };
});
const top = teams[0].standing;
teams.forEach((t) => {
  t.standing.gb = +(((top.w - t.standing.w) + (t.standing.l - top.l)) / 2).toFixed(1);
});

const h2h = {};
H2H_ORDER.forEach((rs, i) => {
  const rid = byShort[rs];
  h2h[rid] = {};
  H2H_ORDER.forEach((cs, j) => {
    if (i === j) return;
    const [w, l, d = 0] = H2H_ROWS[i][j].split("-").map(Number);
    h2h[rid][byShort[cs]] = { w, l, d };
  });
});

const batters = read("raw-batters.tsv").map((l, i) => {
  const c = l.split("\t");
  const n = c.slice(2).map(Number);
  return {
    id: `b${i + 1}`, name: c[0], team: byShort[c[1]],
    g: n[0], pa: n[1], ab: n[2], h: n[3], d2: n[4], d3: n[5], hr: n[6], rbi: n[7], r: n[8],
    sb: n[9], bb: n[10], so: n[11], avg: n[12], obp: n[13], slg: n[14], ops: n[15],
  };
});

const pitchers = read("raw-pitchers.tsv").map((l, i) => {
  const c = l.split("\t");
  return {
    id: `p${i + 1}`, name: c[0], team: byShort[c[1]], role: "SP",
    g: +c[2], w: +c[3], l: +c[4], sv: +c[5], hld: +c[6], ip: c[7], ipNum: +ipToNum(c[7]).toFixed(2),
    np: +c[8], h: +c[9], hr: +c[10], so: +c[11], bb: +c[12], ra: +c[13], er: +c[14],
    era: +c[15], whip: +c[16], qs: +c[17],
  };
});

// ── 팀별 전체 선수 기록 (Daum 팀 > 시즌기록, 현 소속 선수 기준)
// 투수: 이름 ERA 이닝 승 패 세이브 홀드 탈삼진 볼넷 / 타자: 이름 타율 홈런 타점 안타 득점 도루 볼넷
const qualifiedP = new Set(pitchers.map((p) => `${p.team}:${p.name}`));
const qualifiedB = new Set(batters.map((b) => `${b.team}:${b.name}`));
const rosterPitchers = [];
const rosterBatters = [];
for (const t of TEAMS) {
  const id = t[0];
  const file = D(`roster/${id}.txt`);
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").trim().split("\n").slice(1);
  const cut = lines.indexOf("###");
  const seen = {};
  const label = (n) => {
    seen[n] = (seen[n] ?? 0) + 1;
    return seen[n] > 1 ? `${n}(${seen[n]})` : n; // 같은 팀 동명이인 구분
  };
  lines.slice(0, cut).forEach((l, i) => {
    const [name, era, ip, w, l2, sv, hld, so, bb] = l.split("\t");
    const ipNum = +ipToNum(ip).toFixed(2);
    const s = { sv: +sv, hld: +hld };
    const role = s.sv >= 10 ? "CL" : ipNum >= 70 && s.hld < 5 ? "SP" : ipNum >= 45 && s.hld === 0 && s.sv === 0 ? "SP" : "RP";
    rosterPitchers.push({
      id: `rp-${id}-${i}`, name: label(name), team: id, role,
      era: +era, ip, ipNum, w: +w, l: +l2, sv: s.sv, hld: s.hld, so: +so, bb: +bb,
      qualified: qualifiedP.has(`${id}:${name}`),
    });
  });
  lines.slice(cut + 1).forEach((l, i) => {
    const [name, avg, hr, rbi, h, r, sb, bb] = l.split("\t");
    rosterBatters.push({
      id: `rb-${id}-${i}`, name: label(name), team: id,
      avg: +avg, hr: +hr, rbi: +rbi, h: +h, r: +r, sb: +sb, bb: +bb,
      abEst: +avg > 0 ? Math.round(+h / +avg) : 0,
      qualified: qualifiedB.has(`${id}:${name}`),
    });
  });
}

// 포스트시즌
const postseason = {
  bracket: [
    { round: "와일드카드", best: 2, teams: ["lg", "doosan"], wins: { lg: 1, doosan: 0 }, winner: "lg", note: "4위 LG 1승 어드밴티지" },
    { round: "준플레이오프", best: 5, teams: ["kia", "lg"], wins: { kia: 3, lg: 0 }, winner: "kia" },
    { round: "플레이오프", best: 5, teams: ["samsung", "kia"], wins: { samsung: 2, kia: 1 }, winner: null },
    { round: "한국시리즈", best: 7, teams: ["kt", null], wins: {}, winner: null, note: "11월 2일 수원에서 1차전" },
  ],
  games: games.filter((g) => g.type !== "R"),
  highlights: {
    "2026-10-26": "KIA 5-1 승. 카스트로 3회 투런, 한준수 솔로포. 네일 5회 헤드샷 퇴장.",
    "2026-10-27": "삼성 8-3 승. 시리즈 1-1 원점.",
    "2026-10-29": "삼성 6-4 승. 디아즈·류지혁 투런, 7회 박승규 결승 2루타. 원태인 구원승.",
  },
};

// 다음 경기 (예측 대상)
const upcoming = [
  {
    id: "po4", round: "플레이오프 4차전", date: "2026-10-30", time: "18:30",
    stadium: "광주 KIA챔피언스필드", away: "samsung", home: "kia",
    awaySP: "페덱", homeSP: "네일",
    note: "삼성 승리 시 한국시리즈 진출, KIA 승리 시 5차전",
  },
  {
    id: "po5", round: "플레이오프 5차전 (필요 시)", date: "2026-11-01", time: "14:00",
    stadium: "대구 삼성라이온즈파크", away: "kia", home: "samsung",
    awaySP: null, homeSP: null, note: "4차전 KIA 승리 시 개최",
  },
];

const leaders = {
  batting: {
    avg: [["구자욱", "samsung", ".371"], ["레이예스", "lotte", ".363"], ["최원준", "kt", ".356"], ["오스틴", "lg", ".331"], ["박성한", "ssg", ".330"]],
    hr: [["김도영", "kia", "45"], ["힐리어드", "kt", "44"], ["오스틴", "lg", "41"], ["강백호", "hanwha", "34"], ["나성범", "kia", "31"]],
    rbi: [["힐리어드", "kt", "139"], ["디아즈", "samsung", "129"], ["오스틴", "lg", "127"], ["강백호", "hanwha", "118"], ["김도영", "kia", "118"]],
    sb: [["황성빈", "lotte", "55"], ["박민우", "nc", "50"], ["박해민", "lg", "42"], ["박찬호", "doosan", "33"], ["김주원", "nc", "30"]],
    ops: [["오스틴", "lg", "1.062"], ["김도영", "kia", "1.060"], ["구자욱", "samsung", "1.039"], ["힐리어드", "kt", ".967"], ["레이예스", "lotte", ".938"]],
  },
  pitching: {
    w: [["고영표", "kt", "15"], ["임찬규", "lg", "15"], ["최민석", "doosan", "14"], ["네일", "kia", "13"], ["구창모", "nc", "12"]],
    era: [["곽빈", "doosan", "2.24"], ["올러", "kia", "3.13"], ["최민석", "doosan", "3.20"], ["고영표", "kt", "3.28"], ["네일", "kia", "3.49"]],
    so: [["곽빈", "doosan", "197"], ["로드리게스", "lotte", "186"], ["고영표", "kt", "183"], ["올러", "kia", "180"], ["라일리", "nc", "162"]],
    sv: [["김재윤", "samsung", "35"], ["손주영", "lg", "31"], ["박영현", "kt", "30"], ["이영하", "doosan", "26"], ["조병현", "ssg", "24"]],
    whip: [["곽빈", "doosan", "1.04"], ["고영표", "kt", "1.08"], ["올러", "kia", "1.08"], ["알칸타라", "kiwoom", "1.11"], ["네일", "kia", "1.16"]],
  },
  titles: [
    ["타율", "구자욱", "samsung", ".371"], ["홈런", "김도영", "kia", "45"], ["타점", "힐리어드", "kt", "139"],
    ["득점", "최원준", "kt", "125"], ["안타", "레이예스", "lotte", "211"], ["도루", "황성빈", "lotte", "55"],
    ["출루율", "구자욱", "samsung", ".458"], ["장타율", "김도영", "kia", ".647"],
    ["다승", "고영표·임찬규", "kt", "15"], ["평균자책점", "곽빈", "doosan", "2.24"], ["탈삼진", "곽빈", "doosan", "197"],
    ["세이브", "김재윤", "samsung", "35"], ["홀드", "스기모토 코우키", "kt", "25"], ["승률", "소형준", "kt", ".769"],
  ],
};

const meta = {
  season: 2026,
  asOf: "2026-10-30",
  sources: [
    { label: "Daum 스포츠 KBO 기록 (팀·타자·투수·일정)", url: "https://sports.daum.net/record/kbo/team" },
    { label: "Daum 스포츠 팀별 시즌기록 (전체 선수)", url: "https://sports.daum.net/team/kbo" },
    { label: "KBO 대시보드 상대전적 (10/12 반영)", url: "https://kbo-dashboard.co.kr/matchups/" },
    { label: "머니투데이 정규시즌 개인 타이틀 (10/13)", url: "https://www.mt.co.kr/sports/2026/10/13/2026101308565240663" },
    { label: "스타뉴스 PO 3차전 리뷰 (10/29)", url: "https://starnewskorea.com/sports/2026/10/29/2026102917523014713" },
    { label: "톱스타뉴스 PO 4차전 프리뷰 (10/30)", url: "https://www.topstarnews.net/news/articleView.html?idxno=16263217" },
  ],
};

const out = { meta, teams, h2h, batters, pitchers, rosterPitchers, rosterBatters, games, postseason, upcoming, leaders };
fs.writeFileSync(D("kbo-2026.json"), JSON.stringify(out, null, 2));

// 검증: 상대전적 합계 = 시즌 성적
for (const t of teams) {
  const s = Object.values(h2h[t.id]).reduce((a, r) => ({ w: a.w + r.w, l: a.l + r.l, d: a.d + r.d }), { w: 0, l: 0, d: 0 });
  const ok = s.w === t.standing.w && s.l === t.standing.l && s.d === t.standing.d;
  console.log(`${t.short.padEnd(4)} 시즌 ${t.standing.w}-${t.standing.l}-${t.standing.d} / 상대전적 합 ${s.w}-${s.l}-${s.d} ${ok ? "OK" : "MISMATCH"} | 최근10: ${t.recent.map((r) => r.result).join("")}`);
}
console.log(`batters ${batters.length}, pitchers ${pitchers.length}, roster P ${rosterPitchers.length} / B ${rosterBatters.length}, games ${games.length}`);
// 규정 선수 기록이 팀 시즌기록과 일치하는지 확인
for (const p of pitchers) {
  const r = rosterPitchers.find((x) => x.team === p.team && x.name === p.name);
  if (!r || r.era !== p.era || r.w !== p.w || r.so !== p.so) console.log("투수 불일치", p.name, p.team, r?.era, p.era);
}
for (const b of batters) {
  const r = rosterBatters.find((x) => x.team === b.team && x.name === b.name);
  if (!r || r.avg !== b.avg || r.hr !== b.hr || r.h !== b.h) console.log("타자 불일치", b.name, b.team);
}
console.log("역할:", ["SP", "RP", "CL"].map((k) => `${k} ${rosterPitchers.filter((p) => p.role === k).length}`).join(", "));
