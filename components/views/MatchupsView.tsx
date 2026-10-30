import type { KboData } from "@/lib/types";
import Link from "next/link";
import { teamMap } from "@/lib/data";
import { predict } from "@/lib/predict";
import type { TeamId } from "@/lib/types";
import { SectionTitle, TeamBadge } from "@/components/ui";
import WinGauge from "@/components/WinGauge";

const ROUND: Record<string, string> = { WC: "와일드카드", SPO: "준PO", PO: "PO", KS: "KS", R: "정규" };

export default function MatchupsView({ data, searchParams }: { data: KboData; searchParams: { a?: string; b?: string } }) {
  const teams = teamMap(data.teams);
  const ids = data.teams.map((t) => t.id);
  const a = (ids.includes(searchParams.a as TeamId) ? searchParams.a : "samsung") as TeamId;
  let b = (ids.includes(searchParams.b as TeamId) ? searchParams.b : "kia") as TeamId;
  if (a === b) b = ids.find((x) => x !== a)!;
  const A = teams[a];
  const B = teams[b];
  const rec = data.h2h[a][b]!;
  const atA = predict(data, a, b);
  const atB = predict(data, b, a);
  const meetings = data.games.filter((g) => (g.home === a && g.away === b) || (g.home === b && g.away === a)).reverse();

  // 천적 관계 찾기
  const pairs: { w: TeamId; l: TeamId; rec: string; gap: number }[] = [];
  ids.forEach((x) =>
    ids.forEach((y) => {
      if (x >= y) return;
      const r = data.h2h[x][y]!;
      const gap = r.w - r.l;
      if (Math.abs(gap) >= 8) pairs.push(gap > 0 ? { w: x, l: y, rec: `${r.w}-${r.l}${r.d ? `-${r.d}` : ""}`, gap } : { w: y, l: x, rec: `${r.l}-${r.w}${r.d ? `-${r.d}` : ""}`, gap: -gap });
    }),
  );
  pairs.sort((p, q) => q.gap - p.gap);

  return (
    <div className="space-y-12">
      <section>
        <SectionTitle kicker="HEAD TO HEAD" title="2026 상대전적 히트맵" />
        <div className="card overflow-x-auto p-3 sm:p-4">
          <table className="w-full min-w-[680px] border-separate border-spacing-1 text-center text-xs">
            <thead>
              <tr>
                <th className="text-left text-white/40">행 기준 →</th>
                {data.teams.map((t) => (
                  <th key={t.id} className="pb-1">
                    <div className="flex justify-center">
                      <TeamBadge team={t} size={26} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.teams.map((r) => (
                <tr key={r.id}>
                  <th className="pr-2 text-left">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                      {r.short}
                    </span>
                  </th>
                  {data.teams.map((c) => {
                    if (r.id === c.id) return <td key={c.id} className="rounded-md bg-white/[.03]" />;
                    const x = data.h2h[r.id][c.id]!;
                    const p = x.w / (x.w + x.l || 1);
                    const on = (r.id === a && c.id === b);
                    const bg = p >= 0.5 ? `rgba(198,255,61,${0.08 + (p - 0.5) * 1.5})` : `rgba(255,61,154,${0.08 + (0.5 - p) * 1.5})`;
                    return (
                      <td key={c.id} className="p-0">
                        <Link
                          href={`/matchups?a=${r.id}&b=${c.id}#vs`}
                          scroll={false}
                          className={`num block rounded-md px-1 py-2 font-mono font-bold transition hover:scale-105 ${p >= 0.69 ? "text-ink-950" : "text-white"} ${on ? "ring-2 ring-white" : ""}`}
                          style={{ background: bg }}
                          title={`${r.short} vs ${c.short}: ${x.w}승 ${x.l}패 ${x.d}무`}
                        >
                          {x.w}-{x.l}
                          {x.d ? <span className="opacity-60">-{x.d}</span> : null}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 px-1 text-xs text-white/40">초록 = 행 팀 우세, 분홍 = 열세. 칸을 누르면 상세 분석으로 이동해요. (정규시즌 기준)</p>
        </div>
      </section>

      <section id="vs" className="scroll-mt-24">
        <div className="card overflow-hidden">
          <div className="grid items-center gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:p-7" style={{ background: `linear-gradient(100deg, ${A.color}44, transparent 45%, transparent 55%, ${B.color}44)` }}>
            <div className="flex items-center gap-3">
              <TeamBadge team={A} size={60} ring />
              <div>
                <div className="h-display text-3xl text-white">{A.short}</div>
                <div className="text-xs text-white/50">정규 {A.standing.rank}위</div>
              </div>
            </div>
            <div className="text-center">
              <div className="label">시즌 상대전적</div>
              <div className="num h-display text-5xl text-white">
                {rec.w}<span className="mx-2 text-white/30">:</span>{rec.l}
              </div>
              {rec.d > 0 && <div className="text-xs text-white/50">무승부 {rec.d}</div>}
            </div>
            <div className="flex items-center justify-end gap-3 text-right">
              <div>
                <div className="h-display text-3xl text-white">{B.short}</div>
                <div className="text-xs text-white/50">정규 {B.standing.rank}위</div>
              </div>
              <TeamBadge team={B} size={60} ring />
            </div>
          </div>

          <div className="grid gap-6 border-t border-white/10 p-5 sm:p-6 md:grid-cols-2">
            <div className="rounded-xl bg-ink-800/50 p-4">
              <div className="label mb-3">🏟️ {A.stadium}에서 붙으면</div>
              <WinGauge away={B} home={A} homeWin={atA.homeWin} />
            </div>
            <div className="rounded-xl bg-ink-800/50 p-4">
              <div className="label mb-3">🏟️ {B.stadium}에서 붙으면</div>
              <WinGauge away={A} home={B} homeWin={atB.homeWin} />
            </div>
          </div>

          <div className="border-t border-white/10 p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-white">📜 최근 맞대결 기록</h3>
              <span className="text-xs text-white/40">9월 12일 이후 + 포스트시즌</span>
            </div>
            {meetings.length === 0 ? (
              <p className="text-sm text-white/40">이 기간에 두 팀 맞대결 기록이 없어요.</p>
            ) : (
              <ul className="space-y-2">
                {meetings.map((g) => {
                  const win = g.homeScore > g.awayScore ? g.home : g.homeScore < g.awayScore ? g.away : null;
                  const hl = data.postseason.highlights[g.date];
                  return (
                    <li key={g.id} className="rounded-lg bg-white/5 px-3 py-2 text-sm">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="num w-20 font-mono text-xs text-white/50">{g.date.slice(5).replace("-", "/")}</span>
                        <span className={`chip ${g.type !== "R" ? "border-neon-gold/40 text-neon-gold" : ""}`}>{ROUND[g.type]}</span>
                        <span className="num font-mono text-white">
                          <b style={{ color: win === g.away ? teams[g.away].color : undefined }}>{teams[g.away].short} {g.awayScore}</b>
                          <span className="mx-2 text-white/30">:</span>
                          <b style={{ color: win === g.home ? teams[g.home].color : undefined }}>{g.homeScore} {teams[g.home].short}</b>
                        </span>
                        <span className="text-xs text-white/40">@{teams[g.home].stadium.split(" ")[0]}</span>
                      </div>
                      {hl && <p className="mt-1 text-xs text-white/55">{hl}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionTitle kicker="NEMESIS" title="올 시즌 천적 관계" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((p) => (
            <Link key={p.w + p.l} href={`/matchups?a=${p.w}&b=${p.l}#vs`} scroll={false} className="card card-hover flex items-center gap-3 p-4">
              <TeamBadge team={teams[p.w]} size={40} />
              <div className="flex-1">
                <div className="text-sm font-bold text-white">
                  {teams[p.w].short} <span className="text-white/40">→</span> {teams[p.l].short}
                </div>
                <div className="text-xs text-white/50">{teams[p.l].short}의 천적</div>
              </div>
              <span className="num h-display text-2xl text-neon-lime">{p.rec}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
