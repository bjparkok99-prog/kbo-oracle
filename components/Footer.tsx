import { snapshot } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-white/40 sm:px-6">
      <div className="border-t border-white/10 pt-6">
        <p>
          {snapshot.meta.season} 시즌 기록 · {snapshot.meta.asOf} 기준. 예측은 공개 기록을 바탕으로 한 통계 모델이며 실제 결과를
          보장하지 않습니다. 재미로 즐겨주세요.
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {snapshot.meta.sources.map((s) => (
            <li key={s.url}>
              <a className="underline decoration-white/20 hover:text-white/70" href={s.url} target="_blank" rel="noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
