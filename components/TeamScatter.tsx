"use client";

import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, LabelList } from "recharts";
import type { Team } from "@/lib/types";

/** x = 경기당 득점(공격), y = 경기당 실점(수비, 위로 갈수록 적게 내줌) */
export default function TeamScatter({ teams }: { teams: Team[] }) {
  const pts = teams.map((t) => ({
    id: t.id,
    name: t.short,
    color: t.color,
    x: +(t.batting.r / t.standing.g).toFixed(2),
    y: +(t.pitching.ra / t.standing.g).toFixed(2),
  }));
  const avgX = pts.reduce((a, p) => a + p.x, 0) / pts.length;
  const avgY = pts.reduce((a, p) => a + p.y, 0) / pts.length;

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,.06)" />
          <XAxis
            type="number" dataKey="x" domain={[3.6, 6]} ticks={[4, 4.5, 5, 5.5, 6]} tickFormatter={(v) => v.toFixed(1)}
            stroke="rgba(255,255,255,.35)" fontSize={11}
            label={{ value: "경기당 득점 →", position: "insideBottom", offset: -12, fill: "rgba(255,255,255,.5)", fontSize: 11 }}
          />
          <YAxis
            type="number" dataKey="y" reversed domain={[4, 6]} ticks={[4, 4.5, 5, 5.5, 6]} tickFormatter={(v) => v.toFixed(1)}
            stroke="rgba(255,255,255,.35)" fontSize={11} width={36}
          />
          <ReferenceLine x={avgX} stroke="rgba(255,255,255,.2)" strokeDasharray="4 4" />
          <ReferenceLine y={avgY} stroke="rgba(255,255,255,.2)" strokeDasharray="4 4" />
          <Tooltip
            cursor={false}
            content={({ payload }) => {
              const p = payload?.[0]?.payload as (typeof pts)[number] | undefined;
              if (!p) return null;
              return (
                <div className="rounded-lg border border-white/15 bg-ink-900 px-3 py-2 text-xs text-white">
                  <b>{p.name}</b>
                  <div>득점 {p.x} / 실점 {p.y} (경기당)</div>
                </div>
              );
            }}
          />
          <Scatter
            data={pts}
            shape={(props: { cx?: number; cy?: number; payload?: (typeof pts)[number] }) => (
              <circle cx={props.cx} cy={props.cy} r={9} fill={props.payload?.color} stroke="#fff" strokeWidth={1.5} />
            )}
          >
            <LabelList dataKey="name" position="top" offset={12} fill="#fff" fontSize={11} fontWeight={700} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
