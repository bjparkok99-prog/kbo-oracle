"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Game, KboData, TeamId } from "@/lib/types";
import { teamMap } from "@/lib/data";
import { predict } from "@/lib/predict";
import { useFan, levelOf } from "./FanProvider";
import { TeamBadge } from "./ui";

const TYPE: Record<Game["type"], string> = { R: "정규시즌", WC: "와일드카드", SPO: "준플레이오프", PO: "플레이오프", KS: "한국시리즈" };

export default function Quiz({ data }: { data: KboData }) {
  const teams = useMemo(() => teamMap(data.teams), [data]);
  const pool = useMemo(() => data.games.filter((g) => g.homeScore !== g.awayScore), [data]);
  const { fan, quizAnswer, ready } = useFan();
  const [g, setG] = useState<Game | null>(null);
  const [answer, setAnswer] = useState<TeamId | null>(null);
  const [gained, setGained] = useState(0);

  const draw = useCallback(() => {
    setG(pool[Math.floor(Math.random() * pool.length)]);
    setAnswer(null);
    setGained(0);
  }, [pool]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (!g) return <div className="card h-64 animate-pulse" />;

  const A = teams[g.away];
  const H = teams[g.home];
  const winner: TeamId = g.homeScore > g.awayScore ? g.home : g.away;
  const hint = predict(data, g.home, g.away, { neutral: false });
  const correct = answer === winner;
  const lv = levelOf(fan.points);

  const choose = (id: TeamId) => {
    if (answer) return;
    setAnswer(id);
    setGained(quizAnswer(id === winner));
  };

  return (
    <div id="quiz" className="card relative scroll-mt-28 overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="label text-neon-gold">TIME MACHINE QUIZ</div>
          <h3 className="h-display text-2xl text-white">그날 누가 이겼을까?</h3>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="chip">
            정답 {ready ? fan.quiz.correct : 0}/{ready ? fan.quiz.played : 0}
          </span>
          <span className="chip text-neon-pink">🔥 연속 {ready ? fan.quiz.streak : 0}</span>
          <span className="chip text-neon-gold">최고 {ready ? fan.quiz.best : 0}</span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-ink-800/60 p-4 text-center">
        <div className="text-sm text-white/60">
          📅 {g.date.replace(/-/g, ".")} · {TYPE[g.type]} · {H.stadium}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[A, H].map((t) => {
            const isWinner = answer && t.id === winner;
            const isPicked = answer === t.id;
            const score = t.id === g.home ? g.homeScore : g.awayScore;
            return (
              <button
                key={t.id}
                onClick={() => choose(t.id)}
                disabled={!!answer}
                className={`rounded-xl border-2 p-4 transition ${
                  !answer ? "border-white/10 bg-white/5 hover:-translate-y-1 hover:border-white/40" : isWinner ? "animate-pop" : "opacity-40"
                }`}
                style={isWinner ? { borderColor: t.color, background: `${t.color}30` } : isPicked ? { borderColor: "#FF3D9A" } : undefined}
              >
                <div className="flex flex-col items-center gap-2">
                  <TeamBadge team={t} size={54} />
                  <div className="font-black text-white">{t.short}</div>
                  <div className="text-[11px] text-white/45">{t.id === g.home ? "홈" : "원정"}</div>
                  {answer && <div className="num h-display text-4xl text-white">{score}</div>}
                </div>
              </button>
            );
          })}
        </div>
        {!answer && (
          <p className="mt-3 text-xs text-white/40">
            힌트: 오라클 모델은 {teams[hint.favorite].short} 승리 확률을 {(Math.max(hint.homeWin, hint.awayWin) * 100).toFixed(0)}%로 봤어요
          </p>
        )}
      </div>

      {answer && (
        <div className="mt-4 flex animate-rise flex-wrap items-center justify-between gap-3">
          <div className={`text-lg font-black ${correct ? "text-neon-lime" : "text-neon-pink"}`}>
            {correct ? `정답! +${gained}P ${fan.quiz.streak > 1 ? `(🔥${fan.quiz.streak}연속 보너스)` : ""}` : "아쉽! 연속 기록 초기화"}
          </div>
          <button onClick={draw} className="btn-neon">
            다음 경기 →
          </button>
        </div>
      )}

      <div className="mt-5">
        <div className="mb-1 flex justify-between text-xs text-white/50">
          <span>
            {lv.icon} LV.{lv.lv} {lv.name}
          </span>
          <span>{lv.next ? `다음: ${lv.next.name} (${lv.next.min}P)` : "최고 레벨 달성!"}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-lime transition-all duration-700" style={{ width: `${lv.progress * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
