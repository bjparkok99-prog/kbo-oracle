import type { KboData } from "./types";

/**
 * Supabase 연결부 (현재 비활성).
 * 환경변수가 없으면 아무 것도 하지 않으며, 네트워크 요청도 보내지 않습니다.
 * 테이블 구조는 supabase/schema.sql 참고.
 */
export function hasSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getClient() {
  if (!hasSupabase()) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

/** season_snapshots 테이블의 최신 JSON 한 행을 읽습니다. */
export async function loadFromSupabase(): Promise<KboData | null> {
  const sb = await getClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("season_snapshots")
    .select("payload")
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.payload as KboData) ?? null;
}

/** 팬 승부예측 투표 저장 (연결 전에는 로컬스토리지만 사용) */
export async function saveVote(gameId: string, pick: string, voterId: string) {
  const sb = await getClient();
  if (!sb) return { stored: "local" as const };
  const { error } = await sb.from("votes").upsert({ game_id: gameId, pick, voter_id: voterId });
  if (error) throw error;
  return { stored: "supabase" as const };
}
