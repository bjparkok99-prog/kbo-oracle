"use client";

import { useMemo } from "react";
import type { Team } from "@/lib/types";
import { useFan } from "./FanProvider";

/**
 * 팬 투표. Supabase 연결 전에는 내 표만 저장하고,
 * 다른 팬 비율은 게임 ID로 고정된 '데모 집계'를 보여줍니다 (연결 후 실제 집계로 교체).
 */
export default function VoteBox({ gameId, away, home, modelHomeWin }: { gameId: string; away: Team; home: Team; modelHomeWin: number }) {
  const { fan, vote, ready } = useFan();
  const pick = ready ? fan.votes[gameId] : undefined;

  const crowd = useMemo(() => {
    // 결정론적 데모 값: 모델 확률 근처에서 약간 흔들림
    let h = 0;
    for (const c of gameId) h = (h * 31 + c.charCodeAt(0)) % 997;
    const jitter = ((h % 13) - 6) / 100;
    return Math.min(0.85, Math.max(0.15, modelHomeWin + jitter));
  }, [gameId, modelHomeWin]);

  const btn = (t: Team) => {
    const on = pick === t.id;
    return (
      <button
        key={t.id}
        onClick={() => vote(gameId, t.id)}
        className={`btn flex-1 border-2 py-3 text-base ${on ? "animate-pop text-white" : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"}`}
        style={on ? { borderColor: t.color, background: `${t.color}33`, boxShadow: `0 0 24px ${t.color}55` } : undefined}
        aria-pressed={on}
      >
        {on ? "✔ " : ""}
        {t.short} 승리
      </button>
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-ink-800/70 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold text-white">🗳️ 당신의 예측은?</div>
        {!pick && <span className="chip animate-pulseRing border-neon-lime/50 text-neon-lime">+10P</span>}
        {pick && <span className="chip text-neon-lime">투표 완료 · 다시 눌러 변경</span>}
      </div>
      <div className="flex gap-2">{[away, home].map(btn)}</div>
      {pick && (
        <div className="mt-4 animate-rise">
          <div className="mb-1 flex justify-between text-xs text-white/60">
            <span>팬 예측 {Math.round((1 - crowd) * 100)}%</span>
            <span className="text-white/40">팬 투표 현황 (데모)</span>
            <span>{Math.round(crowd * 100)}%</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full">
            <div style={{ width: `${(1 - crowd) * 100}%`, background: away.color }} />
            <div style={{ width: `${crowd * 100}%`, background: home.color }} />
          </div>
        </div>
      )}
    </div>
  );
}
