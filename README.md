# ⚾ KBO 오라클 — 2026 승부예측 & 분석

KBO 팀·선수 기록, 상대전적, 데이터 기반 승부예측을 한 화면에서 보고, 팬 예측 게임까지 즐기는 웹사이트입니다.

- **홈**: 오늘의 빅매치 승리 확률 게이지, 예측 근거, 팬 투표, 한국시리즈 진출 확률, 가을야구 대진표, 파워랭킹, 부문별 TOP 5
- **승부예측**: 팀·선발 선택 시뮬레이터, 가중치 조절, 타임머신 퀴즈(실제 경기 결과 맞히기)
- **팀 분석**: 최종 순위, 공격력 vs 마운드 지도, 팀별 상세(강점 태그, 지표 순위, 주요 선수, 상대 팀별 전적)
- **선수**: 규정타석·규정이닝 선수 기록 표(정렬·검색·팀 필터), 두 선수 VS 레이더 배틀
- **상대전적**: 10×10 히트맵, 맞대결 상세(구장별 예측, 최근 맞대결), 천적 관계

포인트·레벨·투표는 지금은 브라우저(localStorage)에 저장되고, Supabase를 연결하면 서버에 저장할 수 있게 준비되어 있습니다.

## 실행

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 배포 전 확인
```

## 폴더 구조

```
app/            페이지 (홈, predict, teams, players, matchups)
components/     UI 컴포넌트 (게이지, 투표, 퀴즈, 차트 등)
lib/
  data.ts       데이터 진입점 — 로컬 JSON 또는 Supabase
  predict.ts    승부예측 모델
  supabase.ts   Supabase 연결부 (환경변수 없으면 비활성)
data/
  raw-*.tsv/csv 원본 기록
  kbo-2026.json 앱이 읽는 데이터 (scripts/build-data.mjs로 생성)
supabase/
  schema.sql    테이블·RLS 정의
  seed.sql      초기 데이터 (npm run seed:sql로 생성)
```

## 데이터 갱신

1. `data/raw-*.tsv/csv`, `data/roster/<팀>.txt`(팀별 전체 선수 기록), 또는 `scripts/build-data.mjs` 안의 팀 기록·상대전적·다음 경기(`upcoming`)를 수정
2. `node scripts/build-data.mjs` 실행 → `data/kbo-2026.json` 갱신 (상대전적 합계 = 시즌 성적 자동 검증)

## 예측 모델 요약

로그오즈로 아래 요인을 더해 확률로 바꿉니다. 자세한 설명은 `/predict` 페이지 하단과 `lib/predict.ts` 참고.

| 요인 | 방식 |
|---|---|
| 시즌 전력 | (실제 승률 + 피타고리안 기대승률) / 2 → Log5 |
| 홈 어드밴티지 | 약 +2%p |
| 상대전적 | 5승5패 보정 후 절반 반영 |
| 선발 | ERA 1점 차 ≈ 3%p (최대 ±10%p). 이닝이 적으면 팀 ERA 40이닝 분량을 섞어 보정 |
| 최근 10경기 | 승률 차 소폭 반영 (최대 ±6%p) |

## 배포 (나중에 연결할 때)

### GitHub
```bash
git init && git add . && git commit -m "KBO 오라클 첫 버전"
git branch -M main
git remote add origin https://github.com/<계정>/kbo-oracle.git
git push -u origin main
```

### Vercel
1. vercel.com → Add New Project → GitHub 저장소 선택
2. Framework는 Next.js 자동 인식, 설정 그대로 Deploy
3. Supabase를 연결할 때 Settings → Environment Variables에 아래 두 값 추가 후 Redeploy

### Supabase
1. 새 프로젝트 생성 → SQL Editor에서 `supabase/schema.sql` 실행
2. `npm run seed:sql` → 생성된 `supabase/seed.sql` 실행
3. Project Settings → API의 URL·anon key를 `.env.local`(로컬)과 Vercel 환경변수에 입력

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

환경변수가 있으면 `season_snapshots` 최신 행을 읽고, 없거나 실패하면 로컬 JSON을 씁니다.

> 팬 투표의 "다른 팬 비율"은 연결 전까지 데모 값입니다. 연결 후 `vote_totals` 뷰로 실제 집계를 보여주도록 `components/VoteBox.tsx`를 바꾸면 됩니다.

## 데이터 출처 (2026-10-30 기준)

- Daum 스포츠 KBO 기록 — 팀 순위·팀 타격/투수·규정 타자/투수·경기 결과
- Daum 스포츠 팀별 시즌기록 — 10개 구단 전체 선수(투수 269명, 타자 283명, 현 소속 기준)
- kbo-dashboard.co.kr — 팀 간 상대전적(10/12 반영, 시즌 성적과 합계 일치 확인)
- 머니투데이(10/13) — 정규시즌 개인 타이틀
- 스타뉴스·톱스타뉴스 등 — 플레이오프 경기 내용, 4차전 선발

예측은 공개 기록 기반 통계 모델이며 실제 결과를 보장하지 않습니다.
