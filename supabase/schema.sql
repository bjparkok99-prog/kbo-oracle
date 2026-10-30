-- KBO 오라클 Supabase 스키마 (아직 연결하지 않음)
-- Supabase 대시보드 > SQL Editor에 붙여 넣어 실행하세요.

-- 1) 시즌 데이터 스냅샷: 앱이 읽는 JSON 전체를 한 행으로 보관 (가장 단순한 시작점)
create table if not exists public.season_snapshots (
  id bigint generated always as identity primary key,
  season int not null,
  as_of date not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists season_snapshots_as_of_idx on public.season_snapshots (as_of desc);

-- 2) 정규화 테이블 (나중에 기록을 매일 갱신할 때 사용)
create table if not exists public.teams (
  id text primary key,          -- 'kt', 'samsung' ...
  name text not null,
  short text not null,
  color text not null,
  stadium text
);

create table if not exists public.team_season_stats (
  team_id text references public.teams(id),
  season int not null,
  rank int, g int, w int, d int, l int, pct numeric,
  runs int, runs_allowed int, avg numeric, obp numeric, slg numeric, ops numeric, hr int, sb int,
  era numeric, whip numeric, so int, qs int, sv int, hld int,
  updated_at timestamptz default now(),
  primary key (team_id, season)
);

create table if not exists public.players (
  id text primary key,
  name text not null,
  team_id text references public.teams(id),
  role text check (role in ('B','SP','RP','CL'))
);

create table if not exists public.batting_stats (
  player_id text references public.players(id),
  season int not null,
  g int, pa int, ab int, h int, d2 int, d3 int, hr int, rbi int, r int, sb int, bb int, so int,
  avg numeric, obp numeric, slg numeric, ops numeric,
  primary key (player_id, season)
);

create table if not exists public.pitching_stats (
  player_id text references public.players(id),
  season int not null,
  g int, w int, l int, sv int, hld int, ip numeric, so int, bb int, hr int, er int,
  era numeric, whip numeric, qs int,
  primary key (player_id, season)
);

create table if not exists public.games (
  id text primary key,
  season int not null,
  game_date date not null,
  type text not null,           -- R, WC, SPO, PO, KS
  away_id text references public.teams(id),
  home_id text references public.teams(id),
  away_score int,
  home_score int,
  away_sp text,
  home_sp text
);

-- 3) 팬 예측 투표
create table if not exists public.votes (
  game_id text not null,
  voter_id text not null,        -- 익명 ID 또는 auth.uid()
  pick text not null,
  created_at timestamptz not null default now(),
  primary key (game_id, voter_id)
);

create or replace view public.vote_totals as
  select game_id, pick, count(*)::int as votes from public.votes group by game_id, pick;

-- RLS: 기록은 누구나 읽기, 투표는 누구나 넣기(익명). 운영 전에는 auth 기반으로 좁히세요.
alter table public.season_snapshots enable row level security;
alter table public.teams enable row level security;
alter table public.team_season_stats enable row level security;
alter table public.players enable row level security;
alter table public.batting_stats enable row level security;
alter table public.pitching_stats enable row level security;
alter table public.games enable row level security;
alter table public.votes enable row level security;

create policy "public read snapshots" on public.season_snapshots for select using (true);
create policy "public read teams" on public.teams for select using (true);
create policy "public read team stats" on public.team_season_stats for select using (true);
create policy "public read players" on public.players for select using (true);
create policy "public read batting" on public.batting_stats for select using (true);
create policy "public read pitching" on public.pitching_stats for select using (true);
create policy "public read games" on public.games for select using (true);
create policy "public read votes" on public.votes for select using (true);
create policy "anyone can vote" on public.votes for insert with check (true);
create policy "voter can change vote" on public.votes for update using (true);
