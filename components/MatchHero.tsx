import type { KboData, Team, TeamId, Upcoming } from "@/lib/types";
import { findPitcher, predict, qualifiedLine, seriesWinProb } from "@/lib/predict";
import { TeamBadge, FormDots } from "./ui";
import WinGauge from "./WinGauge";
import FactorList from "./FactorList";
import VoteBox from "./VoteBox";
import Countdown from "./Countdown";

export default function MatchHero({ data, game, teams }: { data: KboData; game: Upcoming; teams: Record<TeamId, Team> }) {
  const away = teams[game.away];
  const home = teams[game.home];
  const pr = predict(data, game.home, game.away, { homeSP: game.homeSP, awaySP: game.awaySP });
  const asp = findPitcher(data, game.awaySP, game.away);
  const hsp = findPitcher(data, game.homeSP, game.home);

  // 시리즈 확률: PO 삼성 2승 KIA 1승. 4차전은 위 예측, 5차전은 대구(삼성 홈) 가정
  const po = data.postseason.bracket.find((s) => s.round === "플레이오프");
  let series: { team: Team; prob: number }[] | null = null;
  if (po && !po.winner) {
    const need = (id: TeamId) => 3 - (po.wins[id] ?? 0);
    const g5 = predict(data, "samsung", "kia");
    const pAwayG4 = pr.awayWin; // 삼성(원정) 4차전 승리
    const sam = pAwayG4 + (1 - pAwayG4) * (need("samsung") === 1 ? g5.homeWin : seriesWinProb(g5.homeWin, need("samsung"), need("kia") - 1));
    series = [
      { team: teams.samsung, prob: sam },
      { team: teams.kia, prob: 1 - sam },
    ];
  }

  const spCard = (t: Team, name: string | null, p: ReturnType<typeof findPitcher>, side: "left" | "right") => (
    <div className={`rounded-xl border border-white/10 bg-ink-800/60 p-3 ${side === "right" ? "text-right" : ""}`}>
      <div className="label">선발</div>
      <div className="mt-1 text-lg font-black text-white">{name ?? "미정"}</div>
      {p ? (
        <>
          <div className="num mt-1 font-mono text-xs text-white/60">
            {p.w}승 {p.l}패 · ERA {p.era.toFixed(2)} · {p.so}K
          </div>
          <div className="num mt-0.5 text-[11px] text-white/40">
            {p.ip}이닝{qualifiedLine(data, p) ? ` · QS ${qualifiedLine(data, p)!.qs}` : " · 규정이닝 미달"}
          </div>
        </>
      ) : (
        <div className="mt-1 text-xs text-white/45">선발 미정 · 팀 ERA {t.pitching.era.toFixed(2)}로 계산</div>
      )}
    </div>
  );

  return (
    <section className="card relative overflow-hidden p-5 sm:p-7">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{ background: `linear-gradient(110deg, ${away.color}55 0%, transparent 40%, transparent 60%, ${home.color}55 100%)` }}
      />
      <div className="relative">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="chip border-neon-pink/50 bg-neon-pink/15 text-neon-pink">🔥 오늘의 빅매치</span>
          <span className="chip">{game.round}</span>
          <span className="chip">
            {game.date.slice(5).replace("-", "/")} {game.time} · {game.stadium}
          </span>
          <span className="chip ml-auto text-neon-lime">
            ⏱ <Countdown date={game.date} time={game.time} />
          </span>
        </div>

        <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-3">
            <TeamBadge team={away} size={64} ring />
            <div>
              <div className="label">원정 · 정규 {away.standing.rank}위</div>
              <div className="h-display text-3xl text-white sm:text-4xl">{away.short}</div>
              <FormDots recent={away.recent.slice(0, 5)} size="sm" />
            </div>
          </div>
          <div className="h-display text-center text-2xl text-white/30">VS</div>
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <div className="label">홈 · 정규 {home.standing.rank}위</div>
              <div className="h-display text-3xl text-white sm:text-4xl">{home.short}</div>
              <div className="flex justify-end">
                <FormDots recent={home.recent.slice(0, 5)} size="sm" />
              </div>
            </div>
            <TeamBadge team={home} size={64} ring />
          </div>
        </div>

        <div className="mt-6">
          <WinGauge away={away} home={home} homeWin={pr.homeWin} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/55">
            <span>
              🤖 오라클 판정: <b className="text-white">{teams[pr.favorite].short} {pr.confidence}</b>
            </span>
            <span className="num font-mono">
              예상 스코어 {away.short} {pr.expectedRuns.away} : {pr.expectedRuns.home} {home.short}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {spCard(away, game.awaySP, asp, "left")}
              {spCard(home, game.homeSP, hsp, "right")}
            </div>
            <div className="rounded-xl border border-white/10 bg-ink-800/40 p-4">
              <div className="label mb-3">예측 근거</div>
              <FactorList factors={pr.factors} away={away} home={home} />
            </div>
          </div>
          <div className="space-y-4">
            <VoteBox gameId={game.id} away={away} home={home} modelHomeWin={pr.homeWin} />
            {series && (
              <div className="rounded-xl border border-white/10 bg-ink-800/70 p-4">
                <div className="mb-1 text-sm font-bold text-white">🏆 한국시리즈 진출 확률</div>
                <p className="mb-3 text-xs text-white/50">시리즈 삼성 2승 1패. 4·5차전 예측을 이어 붙인 결과</p>
                {series.map((s) => (
                  <div key={s.team.id} className="mb-2 flex items-center gap-2">
                    <TeamBadge team={s.team} size={26} />
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${s.prob * 100}%`, background: s.team.color }} />
                    </div>
                    <span className="num w-14 text-right font-mono text-sm font-bold text-white">{(s.prob * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-white/45">💡 {game.note}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
