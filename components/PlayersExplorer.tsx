"use client";

import { useMemo, useState } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Legend } from "recharts";
import type { Batter, KboData, Pitcher, TeamId } from "@/lib/types";
import { teamMap } from "@/lib/data";
import { TeamBadge, fmt3 } from "./ui";
import AllPlayersTable from "./AllPlayersTable";

type Tab = "bat" | "pit";

const BAT_COLS: { k: keyof Batter; label: string; f?: (v: number) => string }[] = [
  { k: "g", label: "경기" }, { k: "pa", label: "타석" }, { k: "h", label: "안타" }, { k: "hr", label: "홈런" },
  { k: "rbi", label: "타점" }, { k: "r", label: "득점" }, { k: "sb", label: "도루" }, { k: "bb", label: "사사구" },
  { k: "so", label: "삼진" }, { k: "avg", label: "타율", f: fmt3 }, { k: "obp", label: "출루율", f: fmt3 },
  { k: "slg", label: "장타율", f: fmt3 }, { k: "ops", label: "OPS", f: fmt3 },
];
const PIT_COLS: { k: keyof Pitcher; label: string; f?: (v: number) => string; asc?: boolean }[] = [
  { k: "g", label: "경기" }, { k: "w", label: "승" }, { k: "l", label: "패" }, { k: "ipNum", label: "이닝", f: (v) => { const w = Math.floor(v + 1e-6); const r = Math.round((v - w) * 3); return r ? `${w} ${r}/3` : String(w); } },
  { k: "so", label: "탈삼진" }, { k: "bb", label: "사사구", asc: true }, { k: "hr", label: "피홈런", asc: true },
  { k: "qs", label: "QS" }, { k: "era", label: "ERA", f: (v) => v.toFixed(2), asc: true }, { k: "whip", label: "WHIP", f: (v) => v.toFixed(2), asc: true },
];

// 레이더용 (높을수록 좋게 정규화)
const BAT_RADAR: { k: keyof Batter; label: string; inv?: boolean }[] = [
  { k: "avg", label: "정확도(타율)" }, { k: "obp", label: "선구안(출루)" }, { k: "slg", label: "파워(장타)" },
  { k: "hr", label: "홈런" }, { k: "rbi", label: "해결사(타점)" }, { k: "sb", label: "스피드(도루)" },
];
const PIT_RADAR: { k: keyof Pitcher; label: string; inv?: boolean }[] = [
  { k: "era", label: "실점억제(ERA)", inv: true }, { k: "whip", label: "출루억제(WHIP)", inv: true }, { k: "so", label: "탈삼진" },
  { k: "ipNum", label: "이닝이터" }, { k: "qs", label: "QS" }, { k: "bb", label: "제구(사사구)", inv: true },
];

function percentile<T>(pool: T[], key: keyof T, v: number, inv = false) {
  const vals = pool.map((p) => Number(p[key]));
  const below = vals.filter((x) => (inv ? x > v : x < v)).length;
  const eq = vals.filter((x) => x === v).length;
  return Math.round(((below + eq / 2) / vals.length) * 100);
}

export default function PlayersExplorer({ data, initialQuery = "" }: { data: KboData; initialQuery?: string }) {
  const teams = useMemo(() => teamMap(data.teams), [data]);
  const [tab, setTab] = useState<Tab>("bat");
  const [q, setQ] = useState(initialQuery);
  const [team, setTeam] = useState<TeamId | "all">("all");
  const [scope, setScope] = useState<"qualified" | "all">(() =>
    initialQuery && !data.batters.some((b) => b.name === initialQuery) && data.rosterBatters.some((b) => b.name === initialQuery) ? "all" : "qualified",
  );
  const [sortK, setSortK] = useState<string>("ops");
  const [asc, setAsc] = useState(false);
  const [cmp, setCmp] = useState<string[]>(() => {
    const hit = data.batters.find((b) => b.name === initialQuery);
    return hit ? [hit.id] : ["b9", "b4"]; // 김도영 vs 오스틴 기본
  });

  const switchTab = (t: Tab) => {
    setTab(t);
    setSortK(t === "bat" ? "ops" : "era");
    setAsc(t === "pit");
    setCmp(t === "bat" ? ["b9", "b4"] : ["p1", "p5"]);
  };

  const pool: (Batter | Pitcher)[] = tab === "bat" ? data.batters : data.pitchers;
  const rows = useMemo(() => {
    const list = pool.filter((p) => (team === "all" || p.team === team) && (!q || p.name.includes(q.trim())));
    return [...list].sort((a, b) => {
      const av = Number((a as unknown as Record<string, number>)[sortK]);
      const bv = Number((b as unknown as Record<string, number>)[sortK]);
      return asc ? av - bv : bv - av;
    });
  }, [pool, team, q, sortK, asc]);

  const cols = tab === "bat" ? BAT_COLS : PIT_COLS;
  const toggleCmp = (id: string) =>
    setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-2)));

  const sel = cmp.map((id) => pool.find((p) => p.id === id)).filter(Boolean) as (Batter | Pitcher)[];
  const radarKeys = tab === "bat" ? BAT_RADAR : PIT_RADAR;
  const radarData = radarKeys.map((r) => {
    const row: Record<string, string | number> = { stat: r.label };
    sel.forEach((p) => {
      row[p.name] = percentile(pool as never[], r.k as never, Number((p as unknown as Record<string, number>)[r.k as string]), r.inv);
    });
    return row;
  });
  // 팀 컬러가 비슷한 경우(KIA·LG 등)에도 구분되도록 VS 색은 고정
  const colorOf = (_p: Batter | Pitcher, i: number) => (i === 0 ? "#C6FF3D" : "#3DE8FF");
  // 대결 결과: 레이더 6개 중 몇 개 이겼나
  const score = sel.length === 2
    ? radarData.reduce((acc, r) => {
        const a = Number(r[sel[0].name]);
        const b = Number(r[sel[1].name]);
        return [acc[0] + (a > b ? 1 : 0), acc[1] + (b > a ? 1 : 0)];
      }, [0, 0])
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-white/10 bg-ink-900 p-1">
          {(["bat", "pit"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-bold ${tab === t ? "bg-neon-lime text-ink-950" : "text-white/60"}`}
            >
              {t === "bat" ? "🏏 타자" : "⚾ 투수"}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="선수 이름 검색" className="select max-w-[200px]" />
        <select className="select max-w-[160px]" value={team} onChange={(e) => setTeam(e.target.value as TeamId | "all")}>
          <option value="all">전체 팀</option>
          {data.teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <div className="flex rounded-xl border border-white/10 bg-ink-900 p-1 text-xs">
          {(["qualified", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-lg px-3 py-1.5 font-bold ${scope === s ? "bg-white/15 text-white" : "text-white/50"}`}
            >
              {s === "qualified" ? `${tab === "bat" ? "규정타석" : "규정이닝"} · 상세` : "전체 선수"}
            </button>
          ))}
        </div>
        {scope === "qualified" && <span className="text-xs text-white/40">{rows.length}명</span>}
      </div>

      {scope === "all" ? (
        <AllPlayersTable key={tab} data={data} tab={tab} q={q} team={team} />
      ) : (
      <>
      {/* VS 비교 */}
      <div className="card p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="h-display text-2xl text-white">⚡ 선수 VS 배틀</h3>
          <span className="text-xs text-white/45">표에서 ‘VS’를 눌러 두 명을 고르세요 · 수치는 리그 백분위</span>
        </div>
        {sel.length === 0 ? (
          <p className="py-10 text-center text-white/40">비교할 선수를 골라주세요</p>
        ) : (
          <div className="grid items-center gap-6 lg:grid-cols-[1fr_1.4fr]">
            <div className="space-y-3">
              {sel.map((p, i) => {
                const t = teams[p.team];
                const won = score && score[i] > score[1 - i];
                return (
                  <div key={p.id} className={`flex items-center gap-3 rounded-xl border p-3 ${won ? "animate-pop" : ""}`} style={{ borderColor: `${colorOf(p, i)}88`, background: `${colorOf(p, i)}18` }}>
                    <TeamBadge team={t} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">{p.name}</span>
                        {won && <span className="chip border-neon-gold/50 text-neon-gold">👑 WIN</span>}
                      </div>
                      <div className="num font-mono text-xs text-white/60">
                        {"avg" in p
                          ? `${fmt3(p.avg)} / ${p.hr}HR / ${p.rbi}타점 / OPS ${fmt3(p.ops)}`
                          : `${p.w}승 ${p.l}패 / ERA ${p.era.toFixed(2)} / ${p.so}K / WHIP ${p.whip.toFixed(2)}`}
                      </div>
                    </div>
                    {score && <span className="num h-display text-3xl text-white">{score[i]}</span>}
                  </div>
                );
              })}
              {sel.length === 1 && <p className="text-sm text-white/40">한 명 더 고르면 대결이 시작돼요</p>}
            </div>
            <div className="h-80">
              <ResponsiveContainer>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,.12)" />
                  <PolarAngleAxis dataKey="stat" tick={{ fill: "rgba(255,255,255,.7)", fontSize: 11 }} />
                  {sel.map((p, i) => (
                    <Radar key={p.id} name={p.name} dataKey={p.name} stroke={colorOf(p, i)} fill={colorOf(p, i)} fillOpacity={0.25} strokeWidth={2} isAnimationActive />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* 기록 표 */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="text-xs text-white/45">
            <tr className="border-b border-white/10">
              <th className="px-3 py-3 text-left">#</th>
              <th className="py-3 text-left">선수</th>
              {cols.map((c) => (
                <th key={String(c.k)} className="px-2 py-3 text-right">
                  <button
                    onClick={() => {
                      if (sortK === c.k) setAsc(!asc);
                      else {
                        setSortK(String(c.k));
                        setAsc(Boolean((c as { asc?: boolean }).asc));
                      }
                    }}
                    className={`hover:text-white ${sortK === c.k ? "font-bold text-neon-lime" : ""}`}
                  >
                    {c.label}
                    {sortK === c.k ? (asc ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const t = teams[p.team];
              const on = cmp.includes(p.id);
              return (
                <tr key={p.id} className={`border-b border-white/5 ${on ? "bg-white/[.07]" : "hover:bg-white/[.03]"}`}>
                  <td className="num px-3 py-2 text-white/40">{i + 1}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-xs text-white/40">{t.short}</span>
                    </div>
                  </td>
                  {cols.map((c) => {
                    const v = Number((p as unknown as Record<string, number>)[c.k as string]);
                    return (
                      <td key={String(c.k)} className={`num px-2 py-2 text-right font-mono ${sortK === c.k ? "font-bold text-white" : "text-white/70"}`}>
                        {c.f ? c.f(v) : v}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => toggleCmp(p.id)}
                      className={`rounded-md px-2 py-1 text-xs font-bold ${on ? "bg-neon-lime text-ink-950" : "border border-white/15 text-white/60 hover:text-white"}`}
                    >
                      VS
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </>
      )}
    </div>
  );
}
