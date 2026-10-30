import type { KboData } from "@/lib/types";
import Link from "next/link";
import { teamMap } from "@/lib/data";
import { pythag, teamRating } from "@/lib/predict";
import type { Team, TeamId } from "@/lib/types";
import TeamScatter from "@/components/TeamScatter";
import { FormDots, SectionTitle, StatBar, TeamBadge, fmt3 } from "@/components/ui";

export default function TeamsView({ data, searchParams }: { data: KboData; searchParams: { team?: string } }) {
  const teams = teamMap(data.teams);
  const sel = (data.teams.find((t) => t.id === searchParams.team) ?? data.teams[0]) as Team;
  const range = (f: (t: Team) => number) => {
    const v = data.teams.map(f);
    return { min: Math.min(...v), max: Math.max(...v) };
  };
  const rankOf = (f: (t: Team) => number, desc = true) =>
    [...data.teams].sort((a, b) => (desc ? f(b) - f(a) : f(a) - f(b))).findIndex((t) => t.id === sel.id) + 1;

  const batStats: [string, (t: Team) => number, (v: number) => string, boolean][] = [
    ["타율", (t) => t.batting.avg, fmt3, false],
    ["출루율", (t) => t.batting.obp, fmt3, false],
    ["OPS", (t) => t.batting.ops, fmt3, false],
    ["홈런", (t) => t.batting.hr, String, false],
    ["득점", (t) => t.batting.r, String, false],
    ["도루", (t) => t.batting.sb, String, false],
  ];
  const pitStats: [string, (t: Team) => number, (v: number) => string, boolean][] = [
    ["평균자책점", (t) => t.pitching.era, (v) => v.toFixed(2), true],
    ["WHIP", (t) => t.pitching.whip, (v) => v.toFixed(2), true],
    ["탈삼진", (t) => t.pitching.so, String, false],
    ["피홈런", (t) => t.pitching.hr, String, true],
    ["퀄리티스타트", (t) => t.pitching.qs, String, false],
    ["세이브+홀드", (t) => t.pitching.sv + t.pitching.hld, String, false],
  ];

  const roster = data.batters.filter((b) => b.team === sel.id).sort((a, b) => b.ops - a.ops);
  const bench = data.rosterBatters
    .filter((b) => b.team === sel.id && !b.qualified && b.h >= 30)
    .sort((a, b) => b.h - a.h)
    .slice(0, 4);
  const tp = data.rosterPitchers.filter((p) => p.team === sel.id);
  const rotation = tp.filter((p) => p.role === "SP").sort((a, b) => b.ipNum - a.ipNum).slice(0, 6);
  const bullpen = tp
    .filter((p) => p.role !== "SP" && p.ipNum >= 20)
    .sort((a, b) => b.sv * 2 + b.hld - (a.sv * 2 + a.hld))
    .slice(0, 6);

  // 강점/약점 자동 코멘트
  const tags: string[] = [];
  if (rankOf((t) => t.batting.hr) <= 2) tags.push("💣 홈런 군단");
  if (rankOf((t) => t.batting.avg) <= 2) tags.push("🎯 교타 라인업");
  if (rankOf((t) => t.batting.sb) <= 2) tags.push("💨 발야구");
  if (rankOf((t) => t.pitching.era, false) <= 2) tags.push("🧱 짠물 마운드");
  if (rankOf((t) => t.pitching.qs) <= 2) tags.push("🦾 선발 왕국");
  if (rankOf((t) => t.pitching.hld + t.pitching.sv) <= 2) tags.push("🔒 철벽 불펜");
  if (rankOf((t) => t.pitching.era, false) >= 9) tags.push("⚠️ 마운드 불안");
  if (rankOf((t) => t.batting.ops) >= 9) tags.push("⚠️ 타선 침묵");
  const luck = sel.standing.pct - pythag(sel);
  if (luck > 0.02) tags.push("🍀 운도 실력 (기대승률 초과)");
  if (luck < -0.02) tags.push("😤 불운 (기대승률 미달)");

  return (
    <div className="space-y-12">
      <section>
        <SectionTitle kicker="2026 REGULAR SEASON" title="최종 순위" />
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="text-left text-xs text-white/45">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3">순위</th>
                <th className="py-3">팀</th>
                <th className="py-3 text-right">승-패-무</th>
                <th className="py-3 text-right">승률</th>
                <th className="py-3 text-right">게임차</th>
                <th className="py-3 text-right">득실</th>
                <th className="py-3 pl-6">최근 10경기</th>
                <th className="px-4 py-3 text-right">연속</th>
              </tr>
            </thead>
            <tbody>
              {data.teams.map((t) => {
                const diff = t.batting.r - t.pitching.ra;
                const on = t.id === sel.id;
                return (
                  <tr key={t.id} className={`border-b border-white/5 ${on ? "bg-white/[.07]" : "hover:bg-white/[.03]"}`}>
                    <td className="px-4 py-2.5">
                      <span className={`num h-display text-lg ${t.standing.rank <= 5 ? "text-neon-lime" : "text-white/50"}`}>{t.standing.rank}</span>
                    </td>
                    <td className="py-2.5">
                      <Link href={`/teams?team=${t.id}`} scroll={false} className="flex items-center gap-2 font-bold text-white hover:underline">
                        <TeamBadge team={t} size={28} />
                        {t.name}
                      </Link>
                    </td>
                    <td className="num py-2.5 text-right font-mono text-white/80">
                      {t.standing.w}-{t.standing.l}-{t.standing.d}
                    </td>
                    <td className="num py-2.5 text-right font-mono font-bold text-white">{fmt3(t.standing.pct)}</td>
                    <td className="num py-2.5 text-right font-mono text-white/60">{t.standing.gb === 0 ? "-" : t.standing.gb.toFixed(1)}</td>
                    <td className={`num py-2.5 text-right font-mono ${diff >= 0 ? "text-neon-lime" : "text-neon-pink"}`}>
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </td>
                    <td className="py-2.5 pl-6">
                      <FormDots recent={t.recent} size="sm" />
                    </td>
                    <td className="px-4 py-2.5 text-right text-white/70">{t.standing.streak}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-white/40">1~5위 가을야구 진출. 팀 이름을 누르면 아래에서 상세 분석을 볼 수 있어요.</p>
      </section>

      <section>
        <SectionTitle kicker="OFFENSE × DEFENSE" title="공격력 vs 마운드 지도" />
        <div className="card p-4">
          <TeamScatter teams={data.teams} />
          <p className="px-2 text-xs text-white/45">가로축 = 경기당 득점, 세로축 = 경기당 실점(위로 갈수록 적게 내줌). 오른쪽 위일수록 강팀이에요. 점선은 리그 평균.</p>
        </div>
      </section>

      <section id="detail" className="scroll-mt-24">
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {data.teams.map((t) => (
            <Link
              key={t.id}
              href={`/teams?team=${t.id}#detail`}
              scroll={false}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition ${
                t.id === sel.id ? "border-white/50 bg-white/10 text-white" : "border-white/10 text-white/50 hover:text-white"
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} />
              {t.short}
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-4 p-5 sm:p-6" style={{ background: `linear-gradient(120deg, ${sel.color}55, transparent 70%)` }}>
            <TeamBadge team={sel} size={72} ring />
            <div className="min-w-0 flex-1">
              <div className="label">정규시즌 {sel.standing.rank}위 · {sel.stadium}</div>
              <h2 className="h-display text-3xl text-white sm:text-4xl">{sel.name}</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                ["파워지수", (teamRating(sel) * 100).toFixed(1)],
                ["실제 승률", fmt3(sel.standing.pct)],
                ["기대 승률", fmt3(pythag(sel))],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-ink-950/60 px-3 py-2">
                  <div className="label">{k}</div>
                  <div className="num h-display text-xl text-white">{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-black text-white">🏏 타격 <span className="text-xs font-normal text-white/40">(바 = 10개 구단 중 위치)</span></h3>
              <div className="space-y-3">
                {batStats.map(([k, f, d, inv]) => (
                  <StatBar
                    key={k}
                    label={`${k} · ${rankOf(f, !inv)}위`}
                    value={f(sel)}
                    display={d(f(sel))}
                    {...range(f)}
                    invert={inv}
                    color={sel.color}
                  />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-black text-white">⚾ 투수</h3>
              <div className="space-y-3">
                {pitStats.map(([k, f, d, inv]) => (
                  <StatBar
                    key={k}
                    label={`${k} · ${rankOf(f, !inv)}위`}
                    value={f(sel)}
                    display={d(f(sel))}
                    {...range(f)}
                    invert={inv}
                    color={sel.color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-t border-white/10 p-5 sm:p-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-black text-white">⭐ 주요 타자 <span className="text-xs font-normal text-white/40">(규정타석, OPS 순)</span></h3>
              {roster.length === 0 && <p className="text-sm text-white/40">규정타석 타자 기록 없음</p>}
              <ul className="space-y-2">
                {roster.map((b) => (
                  <li key={b.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <Link href={`/players?q=${encodeURIComponent(b.name)}`} className="font-bold text-white hover:underline">
                      {b.name}
                    </Link>
                    <span className="num font-mono text-xs text-white/70">
                      {fmt3(b.avg)} · {b.hr}HR · {b.rbi}타점 · OPS {fmt3(b.ops)}
                    </span>
                  </li>
                ))}
              </ul>
              {bench.length > 0 && (
                <>
                  <h4 className="mb-2 mt-5 text-sm font-bold text-white/80">🪑 규정타석 미달 주목 선수</h4>
                  <ul className="space-y-2">
                    {bench.map((b) => (
                      <li key={b.id} className="flex items-center justify-between rounded-lg bg-white/[.03] px-3 py-2 text-sm">
                        <Link href={`/players?q=${encodeURIComponent(b.name)}`} className="font-bold text-white/85 hover:underline">
                          {b.name}
                        </Link>
                        <span className="num font-mono text-xs text-white/60">
                          {fmt3(b.avg)} · {b.h}안타 · {b.hr}HR · {b.rbi}타점
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div>
              <h3 className="mb-3 font-black text-white">🔥 선발 로테이션 <span className="text-xs font-normal text-white/40">(이닝 순)</span></h3>
              <ul className="space-y-2">
                {rotation.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                    <span className="flex items-center gap-1.5 font-bold text-white">
                      {p.name}
                      {!p.qualified && <span className="rounded bg-white/10 px-1 text-[10px] font-medium text-white/50">규정 미달</span>}
                    </span>
                    <span className="num font-mono text-xs text-white/70">
                      {p.w}승 {p.l}패 · ERA {p.era.toFixed(2)} · {p.ip}이닝 · {p.so}K
                    </span>
                  </li>
                ))}
              </ul>
              <h4 className="mb-2 mt-5 text-sm font-bold text-white/80">🔒 불펜 핵심 <span className="text-xs font-normal text-white/40">(세이브·홀드 기준)</span></h4>
              <ul className="space-y-2">
                {bullpen.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-white/[.03] px-3 py-2 text-sm">
                    <span className="flex items-center gap-1.5 font-bold text-white/85">
                      {p.name}
                      {p.role === "CL" && <span className="rounded bg-neon-pink/20 px-1 text-[10px] font-bold text-neon-pink">마무리</span>}
                    </span>
                    <span className="num font-mono text-xs text-white/60">
                      {p.sv}세이브 {p.hld}홀드 · ERA {p.era.toFixed(2)} · {p.ip}이닝
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 p-5 sm:p-6">
            <h3 className="mb-3 font-black text-white">⚔️ 상대 팀별 전적</h3>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
              {(Object.entries(data.h2h[sel.id]) as [TeamId, { w: number; l: number; d: number }][]).map(([oid, r]) => {
                const p = r.w / (r.w + r.l || 1);
                return (
                  <Link
                    key={oid}
                    href={`/matchups?a=${sel.id}&b=${oid}`}
                    className="card-hover rounded-xl border border-white/10 p-2 text-center"
                    style={{ background: p > 0.5 ? `rgba(198,255,61,${(p - 0.5) * 0.6})` : `rgba(255,61,154,${(0.5 - p) * 0.6})` }}
                  >
                    <div className="text-xs font-bold text-white">vs {teams[oid].short}</div>
                    <div className="num font-mono text-sm text-white">
                      {r.w}-{r.l}
                      {r.d ? `-${r.d}` : ""}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
