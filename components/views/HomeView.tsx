import type { KboData } from "@/lib/types";
import Link from "next/link";
import { teamMap } from "@/lib/data";
import { teamRating, pythag } from "@/lib/predict";
import MatchHero from "@/components/MatchHero";
import Bracket from "@/components/Bracket";
import { FormDots, SectionTitle, TeamBadge, fmt3 } from "@/components/ui";

const BAT_CAT = { avg: "타율", hr: "홈런", rbi: "타점", sb: "도루", ops: "OPS" } as const;
const PIT_CAT = { w: "다승", era: "평균자책점", so: "탈삼진", sv: "세이브", whip: "WHIP" } as const;

export default function HomeView({ data }: { data: KboData }) {
  const teams = teamMap(data.teams);
  const next = data.upcoming[0];
  const power = [...data.teams].sort((a, b) => teamRating(b) - teamRating(a));

  return (
    <div className="space-y-12">
      {/* 타이틀 홀더 전광판 */}
      <div className="-mx-4 overflow-hidden border-y border-white/10 bg-ink-900/70 py-2 sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap px-4 text-sm">
          {[...data.leaders.titles, ...data.leaders.titles].map(([cat, name, tid, val], i) => (
            <span key={i} className="flex items-center gap-2 text-white/70">
              <span className="text-neon-gold">👑 {cat}</span>
              <b className="text-white">{name}</b>
              <span className="text-xs" style={{ color: teams[tid].color }}>
                {teams[tid].short}
              </span>
              <span className="num font-mono text-neon-lime">{val}</span>
            </span>
          ))}
        </div>
      </div>

      <MatchHero data={data} game={next} teams={teams} />

      <section>
        <SectionTitle kicker="2026 POSTSEASON" title="가을야구 대진표" right={<Link href="/matchups" className="text-sm text-neon-cyan hover:underline">경기 기록 →</Link>} />
        <Bracket bracket={data.postseason.bracket} teams={teams} />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <SectionTitle kicker="POWER RANKING" title="오라클 파워랭킹" right={<Link href="/teams" className="text-sm text-neon-cyan hover:underline">팀 분석 →</Link>} />
          <div className="card divide-y divide-white/5">
            {power.map((t, i) => {
              const diff = t.standing.rank - (i + 1);
              return (
                <Link href={`/teams?team=${t.id}`} key={t.id} className="flex items-center gap-3 px-4 py-3 transition hover:bg-white/5">
                  <span className="num h-display w-6 text-xl text-white/80">{i + 1}</span>
                  <TeamBadge team={t} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{t.short}</span>
                      {diff !== 0 && (
                        <span className={`text-[11px] font-bold ${diff > 0 ? "text-neon-lime" : "text-neon-pink"}`}>
                          {diff > 0 ? `▲${diff}` : `▼${-diff}`} <span className="font-normal text-white/40">vs 순위</span>
                        </span>
                      )}
                    </div>
                    <div className="num truncate text-xs text-white/45">
                      {t.standing.w}승 {t.standing.l}패 {t.standing.d}무 · 득실 {t.batting.r - t.pitching.ra > 0 ? "+" : ""}
                      {t.batting.r - t.pitching.ra} · 기대승률 {fmt3(pythag(t))}
                    </div>
                  </div>
                  <div className="hidden sm:block lg:hidden xl:block">
                    <FormDots recent={t.recent} size="sm" />
                  </div>
                  <span className="num w-12 text-right font-mono text-sm font-bold text-neon-lime">{(teamRating(t) * 100).toFixed(1)}</span>
                </Link>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-white/40">파워 지수 = 실제 승률과 득실점 기대승률(피타고리안)의 평균 × 100. 최근 10경기는 정규시즌 기준, 왼쪽이 최신.</p>
        </div>

        <div>
          <SectionTitle kicker="LEADERBOARD" title="부문별 TOP 5" right={<Link href="/players" className="text-sm text-neon-cyan hover:underline">선수 기록 →</Link>} />
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(BAT_CAT) as (keyof typeof BAT_CAT)[]).slice(0, 3).map((k) => (
              <LeaderCard key={k} title={BAT_CAT[k]} rows={data.leaders.batting[k]} teams={teams} />
            ))}
            {(Object.keys(PIT_CAT) as (keyof typeof PIT_CAT)[]).slice(0, 3).map((k) => (
              <LeaderCard key={k} title={PIT_CAT[k]} rows={data.leaders.pitching[k]} teams={teams} />
            ))}
          </div>
        </div>
      </section>

      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 text-[160px] opacity-10">🕹️</div>
        <div className="label text-neon-gold">MINI GAME</div>
        <h3 className="h-display mt-1 text-2xl text-white sm:text-3xl">타임머신 퀴즈: 그날 누가 이겼을까?</h3>
        <p className="mt-2 max-w-xl text-sm text-white/60">
          실제 2026 시즌 경기를 랜덤으로 꺼내 드려요. 결과를 맞히면 포인트, 연속으로 맞히면 보너스. 레벨을 올려 ‘KBO 오라클’ 칭호에 도전하세요.
        </p>
        <Link href="/predict#quiz" className="btn-neon mt-5">
          퀴즈 시작하기 →
        </Link>
      </section>
    </div>
  );
}

function LeaderCard({ title, rows, teams }: { title: string; rows: [string, string, string][]; teams: ReturnType<typeof teamMap> }) {
  const [first, ...rest] = rows;
  const t1 = teams[first[1] as keyof typeof teams];
  return (
    <div className="card card-hover overflow-hidden">
      <div className="p-3" style={{ background: `linear-gradient(135deg, ${t1.color}40, transparent)` }}>
        <div className="label">{title}</div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <span className="truncate font-black text-white">{first[0]}</span>
          <span className="num h-display text-2xl text-neon-lime">{first[2]}</span>
        </div>
        <div className="text-[11px]" style={{ color: t1.color }}>
          {t1.short}
        </div>
      </div>
      <ol className="space-y-0.5 px-3 pb-3 pt-1 text-xs">
        {rest.map(([n, tid, v], i) => (
          <li key={n + i} className="flex justify-between text-white/60">
            <span className="truncate">
              {i + 2}. {n} <span className="text-white/35">{teams[tid as keyof typeof teams].short}</span>
            </span>
            <span className="num font-mono">{v}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
