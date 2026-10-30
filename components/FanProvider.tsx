"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { saveVote } from "@/lib/supabase";

export interface FanState {
  points: number;
  votes: Record<string, string>; // gameId -> teamId
  quiz: { played: number; correct: number; streak: number; best: number };
  team: string | null; // 응원팀
}

const EMPTY: FanState = { points: 0, votes: {}, quiz: { played: 0, correct: 0, streak: 0, best: 0 }, team: null };
const KEY = "kbo-oracle:fan:v1";

export const LEVELS = [
  { min: 0, name: "직관 새내기", icon: "🧢" },
  { min: 50, name: "덕아웃 해설가", icon: "🎙️" },
  { min: 150, name: "전력분석원", icon: "📋" },
  { min: 300, name: "데이터 감독", icon: "🧠" },
  { min: 600, name: "KBO 오라클", icon: "🔮" },
];

export function levelOf(points: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (points >= l.min) idx = i;
  });
  const next = LEVELS[idx + 1];
  return {
    ...LEVELS[idx],
    lv: idx + 1,
    next,
    progress: next ? (points - LEVELS[idx].min) / (next.min - LEVELS[idx].min) : 1,
  };
}

interface Ctx {
  fan: FanState;
  ready: boolean;
  vote: (gameId: string, teamId: string) => void;
  quizAnswer: (correct: boolean) => number;
  setTeam: (id: string | null) => void;
  reset: () => void;
}

const FanCtx = createContext<Ctx | null>(null);

export function FanProvider({ children }: { children: React.ReactNode }) {
  const [fan, setFan] = useState<FanState>(EMPTY);
  const [ready, setReady] = useState(false);
  const fanRef = useRef(fan);
  fanRef.current = fan;

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setFan({ ...EMPTY, ...JSON.parse(s) });
    } catch {
      /* 저장소를 못 쓰는 환경이면 메모리로만 동작 */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(fan));
    } catch {
      /* ignore */
    }
  }, [fan, ready]);

  const vote = useCallback((gameId: string, teamId: string) => {
    setFan((f) => {
      const first = !f.votes[gameId];
      return { ...f, votes: { ...f.votes, [gameId]: teamId }, points: f.points + (first ? 10 : 0) };
    });
    saveVote(gameId, teamId, "local").catch(() => {});
  }, []);

  const quizAnswer = useCallback((correct: boolean) => {
    const nextStreak = correct ? fanRef.current.quiz.streak + 1 : 0;
    const gained = correct ? 5 + Math.min(nextStreak - 1, 5) * 2 : 0;
    setFan((f) => {
      const streak = correct ? f.quiz.streak + 1 : 0;
      return {
        ...f,
        points: f.points + (correct ? 5 + Math.min(streak - 1, 5) * 2 : 0),
        quiz: {
          played: f.quiz.played + 1,
          correct: f.quiz.correct + (correct ? 1 : 0),
          streak,
          best: Math.max(f.quiz.best, streak),
        },
      };
    });
    return gained;
  }, []);

  const setTeam = useCallback((id: string | null) => setFan((f) => ({ ...f, team: id })), []);
  const reset = useCallback(() => setFan(EMPTY), []);

  return <FanCtx.Provider value={{ fan, ready, vote, quizAnswer, setTeam, reset }}>{children}</FanCtx.Provider>;
}

export function useFan() {
  const c = useContext(FanCtx);
  if (!c) throw new Error("useFan must be used within FanProvider");
  return c;
}
