import type { KboData, Pitcher, RosterPitcher, Team, TeamId } from "./types";

export interface Weights {
  strength: number; // 시즌 전력 (승률 + 피타고리안)
  home: number;     // 홈 어드밴티지
  h2h: number;      // 상대전적
  starter: number;  // 선발 투수
  form: number;     // 최근 10경기
}

export const DEFAULT_WEIGHTS: Weights = { strength: 1, home: 1, h2h: 1, starter: 1, form: 1 };

export interface Factor {
  key: keyof Weights;
  label: string;
  emoji: string;
  /** 홈팀 기준 로그오즈 기여도 (+면 홈 유리) */
  logit: number;
  detail: string;
}

export interface Prediction {
  homeWin: number; // 0~1
  awayWin: number;
  factors: Factor[];
  favorite: TeamId;
  confidence: "박빙" | "근소 우세" | "우세" | "압도";
  expectedRuns: { home: number; away: number };
}

const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export function pythag(t: Team, exp = 1.83) {
  const rs = t.batting.r ** exp;
  const ra = t.pitching.ra ** exp;
  return rs / (rs + ra);
}

/** 시즌 실제 승률과 득실점 기반 기대 승률을 반반 섞은 전력 지수 */
export function teamRating(t: Team) {
  return 0.5 * t.standing.pct + 0.5 * pythag(t);
}

export function formPct(t: Team) {
  const w = t.recent.filter((r) => r.result === "W").length;
  const l = t.recent.filter((r) => r.result === "L").length;
  return w + l === 0 ? 0.5 : w / (w + l);
}

/** 팀 시즌기록에서 투수를 찾습니다 (규정이닝 미달 포함) */
export function findPitcher(data: KboData, name: string | null | undefined, team?: TeamId): RosterPitcher | null {
  if (!name) return null;
  return data.rosterPitchers.find((p) => p.name === name && (!team || p.team === team)) ?? null;
}

/** 규정이닝 투수의 상세 기록 (QS·WHIP 등) */
export function qualifiedLine(data: KboData, p: RosterPitcher | null): Pitcher | null {
  if (!p) return null;
  return data.pitchers.find((q) => q.name === p.name && q.team === p.team) ?? null;
}

/**
 * 표본이 적은 투수의 ERA는 팀 평균 쪽으로 당겨서 씁니다.
 * (이닝 + 40이닝 분량의 팀 평균) 가중 평균 → 150이닝 투수는 거의 그대로, 30이닝 투수는 절반 이상 팀 평균.
 */
export function starterEra(p: RosterPitcher | null, team: Team) {
  if (!p) return { era: team.pitching.era, adjusted: false };
  const k = 40;
  const era = (p.era * p.ipNum + team.pitching.era * k) / (p.ipNum + k);
  return { era, adjusted: true };
}

function leagueEra(data: KboData) {
  const ip = data.teams.reduce((a, t) => a + t.pitching.ipNum, 0);
  const er = data.teams.reduce((a, t) => a + t.pitching.er, 0);
  return (er * 9) / ip;
}

export function predict(
  data: KboData,
  homeId: TeamId,
  awayId: TeamId,
  opts: { homeSP?: string | null; awaySP?: string | null; neutral?: boolean; weights?: Weights } = {},
): Prediction {
  const w = opts.weights ?? DEFAULT_WEIGHTS;
  const H = data.teams.find((t) => t.id === homeId)!;
  const A = data.teams.find((t) => t.id === awayId)!;
  const lgEra = leagueEra(data);

  // 1) 시즌 전력 — Log5
  const rh = teamRating(H);
  const ra = teamRating(A);
  const log5 = (rh - rh * ra) / (rh + ra - 2 * rh * ra);
  const fStrength = logit(log5);

  // 2) 홈 어드밴티지 (KBO 통상 홈 승률 약 .52~.53)
  const fHome = opts.neutral ? 0 : 0.09;

  // 3) 상대전적 — 표본이 작으니 5승5패를 더해 평균 쪽으로 당긴 뒤 절반만 반영
  const rec = data.h2h[homeId]?.[awayId] ?? { w: 0, l: 0, d: 0 };
  const shrunk = (rec.w + 5) / (rec.w + rec.l + 10);
  const fH2H = 0.5 * logit(shrunk);

  // 4) 선발 — 평균자책점 차이 1점당 약 3%p
  const hsp = findPitcher(data, opts.homeSP, homeId);
  const asp = findPitcher(data, opts.awaySP, awayId);
  const hEra = starterEra(hsp, H).era;
  const aEra = starterEra(asp, A).era;
  const fStarter = clamp((aEra - hEra) * 0.12, -0.4, 0.4);

  // 5) 최근 10경기 흐름
  const fForm = clamp((formPct(H) - formPct(A)) * 0.35, -0.25, 0.25);

  const factors: Factor[] = [
    {
      key: "strength", label: "시즌 전력", emoji: "📊", logit: fStrength * w.strength,
      detail: `${H.short} 전력지수 ${rh.toFixed(3)} vs ${A.short} ${ra.toFixed(3)} (승률+득실점 기대승률)`,
    },
    {
      key: "home", label: "홈 어드밴티지", emoji: "🏟️", logit: fHome * w.home,
      detail: opts.neutral ? "중립 구장" : `${H.short} 홈 ${H.stadium}`,
    },
    {
      key: "h2h", label: "시즌 상대전적", emoji: "⚔️", logit: fH2H * w.h2h,
      detail: `${H.short} 기준 ${rec.w}승 ${rec.l}패${rec.d ? ` ${rec.d}무` : ""}`,
    },
    {
      key: "starter", label: "선발 매치업", emoji: "🎯", logit: fStarter * w.starter,
      detail: `${hsp ? `${hsp.name} ERA ${hsp.era.toFixed(2)} (${hsp.ip}이닝, 보정 ${hEra.toFixed(2)})` : `${H.short} 팀 ERA ${H.pitching.era.toFixed(2)}`} vs ${
        asp ? `${asp.name} ERA ${asp.era.toFixed(2)} (${asp.ip}이닝, 보정 ${aEra.toFixed(2)})` : `${A.short} 팀 ERA ${A.pitching.era.toFixed(2)}`
      }`,
    },
    {
      key: "form", label: "최근 10경기", emoji: "🔥", logit: fForm * w.form,
      detail: `${H.short} ${pct(formPct(H))} vs ${A.short} ${pct(formPct(A))}`,
    },
  ];

  const total = factors.reduce((a, f) => a + f.logit, 0);
  const homeWin = clamp(sigmoid(total), 0.03, 0.97);
  const edge = Math.abs(homeWin - 0.5);
  const confidence = edge < 0.04 ? "박빙" : edge < 0.1 ? "근소 우세" : edge < 0.18 ? "우세" : "압도";

  // 기대 득점: 공격력(경기당 득점) × 상대 투수력(ERA/리그ERA)
  const rpgH = H.batting.r / H.standing.g;
  const rpgA = A.batting.r / A.standing.g;
  const expectedRuns = {
    home: +(rpgH * (aEra / lgEra) * (opts.neutral ? 1 : 1.02)).toFixed(1),
    away: +(rpgA * (hEra / lgEra)).toFixed(1),
  };

  return {
    homeWin,
    awayWin: 1 - homeWin,
    factors,
    favorite: homeWin >= 0.5 ? homeId : awayId,
    confidence,
    expectedRuns,
  };
}

/** 각 경기 승률 p로 시리즈를 이길 확률 (needA: A가 더 필요한 승수) */
export function seriesWinProb(p: number, needA: number, needB: number): number {
  if (needA <= 0) return 1;
  if (needB <= 0) return 0;
  return p * seriesWinProb(p, needA - 1, needB) + (1 - p) * seriesWinProb(p, needA, needB - 1);
}

export function factorShare(f: Factor) {
  // 로그오즈 기여를 "약 n%p"로 환산 (0.5 근처 기울기 0.25)
  return f.logit * 25;
}
