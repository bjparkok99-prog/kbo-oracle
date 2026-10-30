"use client";

import { useMemo, useState } from "react";
import type { KboData, TeamId } from "@/lib/types";
import { DEFAULT_WEIGHTS, predict, type Weights } from "@/lib/predict";
import { teamMap } from "@/lib/data";
import WinGauge from "./WinGauge";
import FactorList from "./FactorList";
import { TeamBadge } from "./ui";

const W_LABEL: Record<keyof Weights, string> = {
  strength: "📊 시즌 전력",
  home: "🏟️ 홈 어드밴티지",
  h2h: "⚔️ 상대전적",
  starter: "🎯 선발 매치업",
  form: "🔥 최근 흐름",
};

export default function Simulator({ data }: { data: KboData }) {
  const teams = useMemo(() => teamMap(data.teams), [data]);
  const [away, setAway] = useState<TeamId>("samsung");
  const [home, setHome] = useState<TeamId>("kia");
  const [awaySP, setAwaySP] = useState<string>("페덱");
  const [homeSP, setHomeSP] = useState<string>("네일");
  const [neutral, setNeutral] = useState(false);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [showW, setShowW] = useState(false);

  // 선발 후보: 선발 역할 + 20이닝 이상 던진 투수, 이닝 많은 순
  const spOptions = (id: TeamId) => {
    const list = data.rosterPitchers.filter((p) => p.team === id && p.ipNum >= 20);
    return {
      sp: list.filter((p) => p.role === "SP").sort((a, b) => b.ipNum - a.ipNum),
      rp: list.filter((p) => p.role !== "SP").sort((a, b) => b.ipNum - a.ipNum),
    };
  };
  const pr = predict(data, home, away, { homeSP: homeSP || null, awaySP: awaySP || null, neutral, weights });
  const A = teams[away];
  const H = teams[home];

  const pickTeam = (side: "away" | "home", id: TeamId) => {
    if (side === "away") {
      if (id === home) setHome(away);
      setAway(id);
      setAwaySP("");
    } else {
      if (id === away) setAway(home);
      setHome(id);
      setHomeSP("");
    }
  };

  const swap = () => {
    setAway(home);
    setHome(away);
    setAwaySP(homeSP);
    setHomeSP(awaySP);
  };

  const side = (s: "away" | "home") => {
    const id = s === "away" ? away : home;
    const t = teams[id];
    const sp = s === "away" ? awaySP : homeSP;
    const setSp = s === "away" ? setAwaySP : setHomeSP;
    return (
      <div className="rounded-xl border border-white/10 bg-ink-800/60 p-4" style={{ boxShadow: `inset 0 3px 0 ${t.color}` }}>
        <div className="label mb-2">{s === "away" ? "원정팀" : neutral ? "팀 B" : "홈팀"}</div>
        <div className="mb-3 grid grid-cols-5 gap-1.5">
          {data.teams.map((x) => (
            <button
              key={x.id}
              onClick={() => pickTeam(s, x.id)}
              className={`rounded-lg p-1 transition ${x.id === id ? "bg-white/15 ring-2 ring-white/60" : "opacity-50 hover:opacity-100"}`}
              title={x.name}
            >
              <TeamBadge team={x} size={30} />
            </button>
          ))}
        </div>
        <label className="label mb-1 block">선발 투수</label>
        <select className="select" value={sp} onChange={(e) => setSp(e.target.value)}>
          <option value="">팀 평균 (미정)</option>
          <optgroup label="선발">
            {spOptions(id).sp.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} · ERA {p.era.toFixed(2)} · {p.ip}이닝
              </option>
            ))}
          </optgroup>
          <optgroup label="불펜 (오프너·불펜데이)">
            {spOptions(id).rp.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} · ERA {p.era.toFixed(2)} · {p.ip}이닝
              </option>
            ))}
          </optgroup>
        </select>
      </div>
    );
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {side("away")}
        <button onClick={swap} className="btn-ghost mx-auto h-11 w-11 rounded-full p-0" title="홈/원정 바꾸기" aria-label="홈 원정 바꾸기">
          ⇄
        </button>
        {side("home")}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-white/70">
          <input type="checkbox" checked={neutral} onChange={(e) => setNeutral(e.target.checked)} className="h-4 w-4 accent-[#C6FF3D]" />
          중립 구장
        </label>
        <button onClick={() => setShowW((v) => !v)} className="text-neon-cyan hover:underline">
          {showW ? "가중치 닫기" : "🎛️ 나만의 가중치로 조절하기"}
        </button>
      </div>

      {showW && (
        <div className="mt-4 grid animate-rise gap-4 rounded-xl border border-white/10 bg-ink-800/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
          {(Object.keys(W_LABEL) as (keyof Weights)[]).map((k) => (
            <label key={k} className="text-xs text-white/70">
              <div className="mb-1 flex justify-between">
                <span>{W_LABEL[k]}</span>
                <span className="num font-mono text-neon-lime">×{weights[k].toFixed(1)}</span>
              </div>
              <input
                type="range" min={0} max={3} step={0.1} value={weights[k]}
                onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                className="w-full"
              />
            </label>
          ))}
          <button onClick={() => setWeights(DEFAULT_WEIGHTS)} className="btn-ghost sm:col-span-2 lg:col-span-5">
            기본값으로
          </button>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-white/10 bg-ink-950/50 p-5">
        <WinGauge away={A} home={H} homeWin={pr.homeWin} />
        <div className="mt-3 grid gap-2 text-center text-sm sm:grid-cols-3">
          <div className="rounded-lg bg-white/5 p-2">
            <div className="label">판정</div>
            <div className="font-black text-white">
              {teams[pr.favorite].short} {pr.confidence}
            </div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="label">예상 스코어</div>
            <div className="num font-mono font-bold text-white">
              {A.short} {pr.expectedRuns.away} : {pr.expectedRuns.home} {H.short}
            </div>
          </div>
          <div className="rounded-lg bg-white/5 p-2">
            <div className="label">시즌 상대전적</div>
            <div className="num font-bold text-white">
              {A.short} {data.h2h[away]?.[home]?.w ?? 0}승 {data.h2h[away]?.[home]?.l ?? 0}패
              {data.h2h[away]?.[home]?.d ? ` ${data.h2h[away]?.[home]?.d}무` : ""}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <FactorList factors={pr.factors} away={A} home={H} />
        </div>
      </div>
    </div>
  );
}
