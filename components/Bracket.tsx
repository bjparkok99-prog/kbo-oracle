import type { Series, Team, TeamId } from "@/lib/types";
import { TeamBadge } from "./ui";

export default function Bracket({ bracket, teams }: { bracket: Series[]; teams: Record<TeamId, Team> }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {bracket.map((s, i) => {
        const live = !s.winner && s.teams.every(Boolean);
        return (
          <div
            key={s.round}
            className={`card relative p-4 ${live ? "border-neon-lime/50 shadow-[0_0_30px_rgba(198,255,61,.12)]" : ""}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="label">
                {i + 1}. {s.round}
              </span>
              {live && <span className="chip border-neon-lime/40 text-neon-lime">● LIVE</span>}
              {s.winner && <span className="chip">종료</span>}
            </div>
            <div className="space-y-2">
              {s.teams.map((id, j) => {
                if (!id)
                  return (
                    <div key={j} className="flex items-center gap-2 text-sm text-white/40">
                      <span className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-white/20">?</span>
                      PO 승자
                    </div>
                  );
                const t = teams[id];
                const w = s.wins[id] ?? 0;
                const lost = s.winner && s.winner !== id;
                return (
                  <div key={id} className={`flex items-center gap-2 ${lost ? "opacity-40" : ""}`}>
                    <TeamBadge team={t} size={32} />
                    <span className="flex-1 text-sm font-bold text-white">{t.short}</span>
                    <span className="num h-display text-xl text-white">{s.teams[1] ? w : ""}</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[11px] text-white/40">
              {s.best}전 {Math.ceil(s.best / 2)}선승{s.note ? ` · ${s.note}` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}
