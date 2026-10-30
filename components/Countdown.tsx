"use client";

import { useEffect, useState } from "react";

/** KST 기준 경기 시작까지 남은 시간 */
export default function Countdown({ date, time }: { date: string; time: string }) {
  const target = new Date(`${date}T${time}:00+09:00`).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return <span className="num font-mono">--:--:--</span>;
  const diff = target - now;
  if (diff <= 0) return <span className="font-bold text-neon-pink">경기 시작!</span>;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <span className="num font-mono">
      {d > 0 ? `${d}일 ` : ""}
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}
