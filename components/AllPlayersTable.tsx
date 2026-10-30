"use client";

import { useMemo, useState } from "react";
import type { KboData, RosterBatter, RosterPitcher, TeamId } from "@/lib/types";
import { teamMap } from "@/lib/data";
import { fmt3 } from "./ui";

type Col<T> = { k: keyof T; label: string; f?: (v: number, row: T) => string; asc?: boolean };

const B_COLS: Col<RosterBatter>[] = [
  { k: "abEst", label: "타수(추정)" }, { k: "h", label: "안타" }, { k: "hr", label: "홈런" }, { k: "rbi", label: "타점" },
  { k: "r", label: "득점" }, { k: "sb", label: "도루" }, { k: "bb", label: "볼넷" }, { k: "avg", label: "타율", f: fmt3 },
];
const P_COLS: Col<RosterPitcher>[] = [
  { k: "ipNum", label: "이닝", f: (_v, r) => r.ip }, { k: "w", label: "승" }, { k: "l", label: "패", asc: true },
  { k: "sv", label: "세이브" }, { k: "hld", label: "홀드" }, { k: "so", label: "탈삼진" }, { k: "bb", label: "볼넷", asc: true },
  { k: "era", label: "ERA", f: (v) => v.toFixed(2), asc: true },
];
const ROLE: Record<RosterPitcher["role"], string> = { SP: "선발", RP: "불펜", CL: "마무리" };

/** 규정 미달 포함 전체 선수 표 (팀 시즌기록 기준) */
export default function AllPlayersTable({
  data, tab, q, team,
}: { data: KboData; tab: "bat" | "pit"; q: string; team: TeamId | "all" }) {
  const teams = useMemo(() => teamMap(data.teams), [data]);
  const [sortK, setSortK] = useState<string>(tab === "bat" ? "h" : "ipNum");
  const [asc, setAsc] = useState(false);
  const [minSample, setMinSample] = useState(true);
  const [role, setRole] = useState<"all" | RosterPitcher["role"]>("all");

  const cols = (tab === "bat" ? B_COLS : P_COLS) as Col<RosterBatter & RosterPitcher>[];
  const rows = useMemo(() => {
    const src = (tab === "bat" ? data.rosterBatters : data.rosterPitchers) as (RosterBatter & RosterPitcher)[];
    return src
      .filter((p) => (team === "all" || p.team === team) && (!q || p.name.includes(q.trim())))
      .filter((p) => (tab === "pit" && role !== "all" ? p.role === role : true))
      .filter((p) => !minSample || (tab === "bat" ? p.abEst >= 30 : p.ipNum >= 10))
      .sort((a, b) => {
        const av = Number(a[sortK as keyof typeof a]);
        const bv = Number(b[sortK as keyof typeof b]);
        return asc ? av - bv : bv - av;
      });
  }, [data, tab, team, q, sortK, asc, minSample, role]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-white/70">
          <input type="checkbox" checked={minSample} onChange={(e) => setMinSample(e.target.checked)} className="h-4 w-4 accent-[#C6FF3D]" />
          {tab === "bat" ? "30타수 이상만" : "10이닝 이상만"}
        </label>
        {tab === "pit" && (
          <div className="flex gap-1">
            {(["all", "SP", "RP", "CL"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold ${role === r ? "bg-white/15 text-white" : "text-white/50 hover:text-white"}`}
              >
                {r === "all" ? "전체" : ROLE[r]}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-white/40">{rows.length}명</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-xs text-white/45">
            <tr className="border-b border-white/10">
              <th className="px-3 py-3 text-left">#</th>
              <th className="py-3 text-left">선수</th>
              {tab === "pit" && <th className="px-2 py-3 text-left">역할</th>}
              {cols.map((c) => (
                <th key={String(c.k)} className="px-2 py-3 text-right">
                  <button
                    onClick={() => {
                      if (sortK === c.k) setAsc(!asc);
                      else {
                        setSortK(String(c.k));
                        setAsc(Boolean(c.asc));
                      }
                    }}
                    className={`hover:text-white ${sortK === c.k ? "font-bold text-neon-lime" : ""}`}
                  >
                    {c.label}
                    {sortK === c.k ? (asc ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const t = teams[p.team];
              return (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/[.03]">
                  <td className="num px-3 py-2 text-white/40">{i + 1}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
                      <span className="font-bold text-white">{p.name}</span>
                      <span className="text-xs text-white/40">{t.short}</span>
                      {p.qualified && <span className="rounded bg-neon-lime/15 px-1 text-[10px] font-bold text-neon-lime">규정</span>}
                    </div>
                  </td>
                  {tab === "pit" && (
                    <td className={`px-2 py-2 text-xs ${p.role === "CL" ? "font-bold text-neon-pink" : "text-white/55"}`}>{ROLE[p.role]}</td>
                  )}
                  {cols.map((c) => {
                    const v = Number(p[c.k]);
                    return (
                      <td key={String(c.k)} className={`num px-2 py-2 text-right font-mono ${sortK === c.k ? "font-bold text-white" : "text-white/70"}`}>
                        {c.f ? c.f(v, p) : v}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-white/40">
        Daum 스포츠 팀별 시즌기록(현 소속 선수) 기준. 시즌 중 이적·방출된 선수는 빠져 있을 수 있어요. 타수는 안타÷타율로 추정한 값이에요.
        역할은 세이브·홀드·이닝으로 자동 분류했어요.
      </p>
    </div>
  );
}
