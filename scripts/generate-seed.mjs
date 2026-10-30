// data/kbo-2026.json → supabase/seed.sql (season_snapshots 한 행 + teams)
// 사용법: npm run seed:sql
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "data", "kbo-2026.json"), "utf8"));
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;

const lines = [
  "-- 자동 생성 파일: npm run seed:sql",
  `insert into public.season_snapshots (season, as_of, payload) values (${data.meta.season}, ${q(data.meta.asOf)}, ${q(JSON.stringify(data))}::jsonb);`,
  ...data.teams.map(
    (t) => `insert into public.teams (id, name, short, color, stadium) values (${q(t.id)}, ${q(t.name)}, ${q(t.short)}, ${q(t.color)}, ${q(t.stadium)}) on conflict (id) do update set name = excluded.name, color = excluded.color, stadium = excluded.stadium;`,
  ),
];
fs.writeFileSync(path.join(root, "supabase", "seed.sql"), lines.join("\n") + "\n");
console.log("supabase/seed.sql 생성 완료");
