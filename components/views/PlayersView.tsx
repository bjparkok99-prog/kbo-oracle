import type { KboData } from "@/lib/types";
import PlayersExplorer from "@/components/PlayersExplorer";
import { SectionTitle } from "@/components/ui";

export default function PlayersView({ data, searchParams }: { data: KboData; searchParams: { q?: string } }) {
  return (
    <div>
      <SectionTitle kicker="PLAYER STATS" title="선수 시즌 성적 & VS 배틀" />
      <PlayersExplorer data={data} initialQuery={searchParams.q ?? ""} key={searchParams.q ?? ""} />
      <p className="mt-3 text-xs text-white/40">
        상세 표와 VS 배틀은 규정타석·규정이닝을 채운 선수 기준이에요(레이더는 같은 그룹 안 백분위 0~100). ‘전체 선수’에서는 불펜·백업까지 10개 구단 선수 기록을 볼 수 있어요.
      </p>
    </div>
  );
}
