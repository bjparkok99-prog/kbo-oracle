import type { FormGame, Team } from "@/lib/types";

export function TeamBadge({ team, size = 40, ring = false }: { team: Team; size?: number; ring?: boolean }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-display leading-none text-white ${ring ? "ring-2 ring-white/30" : ""}`}
      style={{
        width: size,
        height: size,
        fontSize: size * (team.short.length > 2 ? 0.3 : 0.36),
        background: `radial-gradient(circle at 30% 25%, ${team.color}, ${team.color2} 140%)`,
        boxShadow: `0 0 ${size / 2.5}px ${team.color}55`,
      }}
      aria-label={team.name}
    >
      {team.short}
    </span>
  );
}

export function FormDots({ recent, size = "md" }: { recent: FormGame[]; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-4 w-4 text-[9px]" : "h-6 w-6 text-[11px]";
  return (
    <div className="flex gap-1" aria-label="최근 10경기 (왼쪽이 최신)">
      {recent.map((r, i) => (
        <span
          key={i}
          title={`${r.date} ${r.home ? "홈" : "원정"} ${r.score}`}
          className={`grid ${s} place-items-center rounded-md font-bold ${
            r.result === "W"
              ? "bg-neon-lime text-ink-950"
              : r.result === "L"
                ? "bg-white/10 text-white/50"
                : "bg-neon-gold/70 text-ink-950"
          }`}
        >
          {r.result === "W" ? "승" : r.result === "L" ? "패" : "무"}
        </span>
      ))}
    </div>
  );
}

export function SectionTitle({ kicker, title, right }: { kicker?: string; title: string; right?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {kicker && <div className="label mb-1 text-neon-cyan/80">{kicker}</div>}
        <h2 className="h-display text-2xl text-white sm:text-3xl">{title}</h2>
      </div>
      {right}
    </div>
  );
}

/** 리그 평균 대비 위치를 0~100으로 보여주는 바 */
export function StatBar({
  label, value, display, min, max, invert = false, color = "#C6FF3D",
}: {
  label: string; value: number; display: string; min: number; max: number; invert?: boolean; color?: string;
}) {
  let r = (value - min) / (max - min || 1);
  if (invert) r = 1 - r;
  const w = Math.max(4, Math.min(100, r * 100));
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="num font-mono font-bold text-white">{display}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  );
}

export const fmt3 = (v: number) => (v >= 1 ? v.toFixed(3) : v.toFixed(3).replace(/^0/, ""));
export const pctStr = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;
