"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { levelOf, useFan } from "./FanProvider";

const LINKS = [
  { href: "/", label: "홈" },
  { href: "/predict", label: "승부예측" },
  { href: "/teams", label: "팀 분석" },
  { href: "/players", label: "선수" },
  { href: "/matchups", label: "상대전적" },
];

export default function Nav() {
  const path = usePathname();
  const { fan, ready } = useFan();
  const lv = levelOf(fan.points);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-neon-lime text-lg text-ink-950 shadow-[0_0_18px_rgba(198,255,61,.5)]">
            ⚾
          </span>
          <span className="h-display text-lg leading-none text-white">
            KBO <span className="text-neon-lime">오라클</span>
          </span>
        </Link>

        <nav className="ml-2 hidden gap-1 md:flex">
          {LINKS.map((l) => {
            const on = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  on ? "bg-white/10 text-white" : "text-white/55 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div
          className="ml-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-1 pr-3"
          title="승부예측 투표와 타임머신 퀴즈로 포인트를 모아 레벨업하세요"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-700 text-sm">{lv.icon}</span>
          <div className="leading-tight">
            <div className="text-[10px] font-bold text-neon-lime">
              LV.{lv.lv} {lv.name}
            </div>
            <div className="num font-mono text-xs text-white/80">{ready ? fan.points : 0} P</div>
          </div>
        </div>
      </div>

      {/* 모바일 탭 */}
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-3 py-2 md:hidden">
        {LINKS.map((l) => {
          const on = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold ${
                on ? "bg-neon-lime text-ink-950" : "text-white/60"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
