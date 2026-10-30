"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/lib/types";

/** 줄다리기 형태의 승리 확률 게이지 (왼쪽 = away, 오른쪽 = home) */
export default function WinGauge({ away, home, homeWin }: { away: Team; home: Team; homeWin: number }) {
  const [p, setP] = useState(0.5);
  useEffect(() => {
    const id = requestAnimationFrame(() => setP(homeWin));
    return () => cancelAnimationFrame(id);
  }, [homeWin]);

  const awayPct = Math.round((1 - homeWin) * 1000) / 10;
  const homePct = Math.round(homeWin * 1000) / 10;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold" style={{ color: away.color }}>
            {away.short} 승리
          </div>
          <div className={`num h-display text-4xl sm:text-5xl ${awayPct >= homePct ? "text-white" : "text-white/40"}`}>
            {awayPct.toFixed(1)}
            <span className="text-xl">%</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold" style={{ color: home.color }}>
            {home.short} 승리
          </div>
          <div className={`num h-display text-4xl sm:text-5xl ${homePct > awayPct ? "text-white" : "text-white/40"}`}>
            {homePct.toFixed(1)}
            <span className="text-xl">%</span>
          </div>
        </div>
      </div>
      <div className="relative h-5 overflow-hidden rounded-full bg-ink-700">
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-1000 ease-out"
          style={{ width: `${(1 - p) * 100}%`, background: `linear-gradient(90deg, ${away.color}, ${away.color}cc)` }}
        />
        <div
          className="absolute inset-y-0 right-0 transition-[width] duration-1000 ease-out"
          style={{ width: `${p * 100}%`, background: `linear-gradient(270deg, ${home.color}, ${home.color}cc)` }}
        />
        <div
          className="absolute inset-y-[-4px] w-1.5 -translate-x-1/2 rounded bg-white shadow-[0_0_12px_white] transition-[left] duration-1000 ease-out"
          style={{ left: `${(1 - p) * 100}%` }}
        />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/30" />
      </div>
    </div>
  );
}
