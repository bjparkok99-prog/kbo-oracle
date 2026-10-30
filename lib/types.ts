export type TeamId =
  | "kt" | "samsung" | "kia" | "lg" | "doosan" | "ssg" | "lotte" | "nc" | "hanwha" | "kiwoom";

export interface FormGame {
  date: string;
  opp: TeamId;
  home: boolean;
  score: string;
  result: "W" | "L" | "D";
}

export interface Team {
  id: TeamId;
  name: string;
  short: string;
  color: string;
  color2: string;
  stadium: string;
  standing: { rank: number; g: number; w: number; d: number; l: number; pct: number; gb: number; streak: string };
  batting: {
    ab: number; h: number; d2: number; d3: number; hr: number; rbi: number; r: number; sb: number;
    bb: number; so: number; gdp: number; avg: number; obp: number; slg: number; ops: number;
  };
  pitching: {
    ip: string; ipNum: number; h: number; hr: number; ra: number; er: number; bb: number; so: number;
    era: number; e: number; whip: number; qs: number; hld: number; sv: number;
  };
  recent: FormGame[];
}

export interface Batter {
  id: string; name: string; team: TeamId;
  g: number; pa: number; ab: number; h: number; d2: number; d3: number; hr: number; rbi: number; r: number;
  sb: number; bb: number; so: number; avg: number; obp: number; slg: number; ops: number;
}

export interface Pitcher {
  id: string; name: string; team: TeamId; role: "SP" | "RP" | "CL";
  g: number; w: number; l: number; sv: number; hld: number; ip: string; ipNum: number;
  np: number; h: number; hr: number; so: number; bb: number; ra: number; er: number;
  era: number; whip: number; qs: number;
}

/** 팀 시즌기록의 전체 투수 (규정이닝 미달 포함) */
export interface RosterPitcher {
  id: string; name: string; team: TeamId; role: "SP" | "RP" | "CL";
  era: number; ip: string; ipNum: number; w: number; l: number; sv: number; hld: number;
  so: number; bb: number; qualified: boolean;
}

/** 팀 시즌기록의 전체 타자 (규정타석 미달 포함) */
export interface RosterBatter {
  id: string; name: string; team: TeamId;
  avg: number; hr: number; rbi: number; h: number; r: number; sb: number; bb: number;
  abEst: number; qualified: boolean;
}

export interface Game {
  id: string; date: string; away: TeamId; home: TeamId;
  awayScore: number; homeScore: number; type: "R" | "WC" | "SPO" | "PO" | "KS";
}

export interface H2HRecord { w: number; l: number; d: number }
export type H2H = Record<TeamId, Partial<Record<TeamId, H2HRecord>>>;

export interface Upcoming {
  id: string; round: string; date: string; time: string; stadium: string;
  away: TeamId; home: TeamId; awaySP: string | null; homeSP: string | null; note: string;
}

export interface Series {
  round: string; best: number; teams: (TeamId | null)[];
  wins: Partial<Record<TeamId, number>>; winner: TeamId | null; note?: string;
}

export type LeaderRow = [string, TeamId, string];

export interface KboData {
  meta: { season: number; asOf: string; sources: { label: string; url: string }[] };
  teams: Team[];
  h2h: H2H;
  batters: Batter[];
  pitchers: Pitcher[];
  rosterPitchers: RosterPitcher[];
  rosterBatters: RosterBatter[];
  games: Game[];
  postseason: { bracket: Series[]; games: Game[]; highlights: Record<string, string> };
  upcoming: Upcoming[];
  leaders: {
    batting: Record<"avg" | "hr" | "rbi" | "sb" | "ops", LeaderRow[]>;
    pitching: Record<"w" | "era" | "so" | "sv" | "whip", LeaderRow[]>;
    titles: [string, string, TeamId, string][];
  };
}
