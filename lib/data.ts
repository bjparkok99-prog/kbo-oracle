import raw from "@/data/kbo-2026.json";
import type { KboData, Team, TeamId } from "./types";
import { hasSupabase, loadFromSupabase } from "./supabase";

const local = raw as unknown as KboData;

/**
 * 앱 전체의 데이터 진입점.
 * - 지금은 data/kbo-2026.json(로컬)을 사용합니다.
 * - .env에 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY를 넣으면 Supabase에서 읽고,
 *   실패하면 로컬 데이터로 되돌아갑니다.
 */
export async function getData(): Promise<KboData> {
  if (hasSupabase()) {
    try {
      const remote = await loadFromSupabase();
      if (remote) return remote;
    } catch (e) {
      console.warn("[data] Supabase 로드 실패, 로컬 데이터 사용", e);
    }
  }
  return local;
}

/** 클라이언트 컴포넌트에서 동기적으로 쓰는 로컬 스냅샷 */
export const snapshot = local;

export const teamMap = (teams: Team[]) =>
  Object.fromEntries(teams.map((t) => [t.id, t])) as Record<TeamId, Team>;

export function leagueAverages(teams: Team[]) {
  const sum = (f: (t: Team) => number) => teams.reduce((a, t) => a + f(t), 0);
  const ip = sum((t) => t.pitching.ipNum);
  const er = sum((t) => t.pitching.er);
  const runs = sum((t) => t.batting.r);
  const games = sum((t) => t.standing.g);
  return {
    era: (er * 9) / ip,
    runsPerGame: runs / games,
    avg: sum((t) => t.batting.h) / sum((t) => t.batting.ab),
    ops: sum((t) => t.batting.ops) / teams.length,
  };
}
