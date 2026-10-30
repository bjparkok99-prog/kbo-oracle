import type { Factor } from "@/lib/predict";
import { factorShare } from "@/lib/predict";
import type { Team } from "@/lib/types";

/** 각 요인이 어느 팀 쪽으로 몇 %p 당겼는지 보여주는 양방향 바 */
export default function FactorList({ factors, away, home }: { factors: Factor[]; away: Team; home: Team }) {
  const max = Math.max(6, ...factors.map((f) => Math.abs(factorShare(f))));
  return (
    <ul className="space-y-3">
      {factors.map((f) => {
        const s = factorShare(f);
        const toHome = s >= 0;
        const w = (Math.abs(s) / max) * 50;
        const t = toHome ? home : away;
        return (
          <li key={f.key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="font-semibold text-white">
                {f.emoji} {f.label}
              </span>
              <span className="num font-mono text-xs" style={{ color: Math.abs(s) < 0.3 ? "#ffffff80" : t.color }}>
                {Math.abs(s) < 0.3 ? "영향 미미" : `${t.short} +${Math.abs(s).toFixed(1)}%p`}
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-white/5">
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/25" />
              <div
                className="absolute inset-y-0 rounded-full transition-all duration-700"
                style={{
                  left: toHome ? "50%" : `${50 - w}%`,
                  width: `${w}%`,
                  background: t.color,
                }}
              />
            </div>
            <p className="mt-1 text-xs text-white/45">{f.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
