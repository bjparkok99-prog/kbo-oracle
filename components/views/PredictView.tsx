import type { KboData } from "@/lib/types";
import Simulator from "@/components/Simulator";
import Quiz from "@/components/Quiz";
import { SectionTitle } from "@/components/ui";

export default function PredictView({ data }: { data: KboData }) {
  return (
    <div className="space-y-12">
      <section>
        <SectionTitle kicker="MATCH SIMULATOR" title="승부예측 시뮬레이터" />
        <p className="-mt-2 mb-5 max-w-2xl text-sm text-white/55">
          두 팀과 선발 투수를 고르면 2026 시즌 기록으로 승리 확률을 계산해요. 가중치를 바꿔 나만의 예측 모델도 만들어 보세요.
        </p>
        <Simulator data={data} />
      </section>

      <section>
        <Quiz data={data} />
      </section>

      <section className="card p-5 text-sm text-white/65 sm:p-6">
        <h3 className="h-display mb-3 text-xl text-white">🤖 오라클 모델은 이렇게 계산해요</h3>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <b className="text-white">시즌 전력</b>: 실제 승률과 득실점으로 구한 기대 승률(피타고리안, 지수 1.83)을 반씩 섞은 전력 지수를 Log5 공식으로 맞대결 확률로 바꿔요.
          </li>
          <li>
            <b className="text-white">홈 어드밴티지</b>: 홈팀에 약 2%p를 더해요.
          </li>
          <li>
            <b className="text-white">상대전적</b>: 16경기 안팎의 작은 표본이라 5승 5패를 더해 평균 쪽으로 당긴 뒤 절반만 반영해요.
          </li>
          <li>
            <b className="text-white">선발 매치업</b>: 평균자책점 1점 차이를 약 3%p로 환산해요(최대 ±10%p). 이닝이 적은 투수는 운의 영향이 커서, 팀 평균자책점 40이닝 분량을 섞어 보정해요(예: 76이닝 ERA 2.95 → 보정 3.42).
          </li>
          <li>
            <b className="text-white">최근 흐름</b>: 정규시즌 마지막 10경기 승률 차이를 조금 반영해요(최대 ±6%p).
          </li>
        </ol>
        <p className="mt-3 text-xs text-white/40">모든 요인은 로그오즈로 더한 뒤 확률로 바꿔요. 재미를 위한 통계 모델이며 실제 결과를 보장하지 않습니다.</p>
      </section>
    </div>
  );
}
