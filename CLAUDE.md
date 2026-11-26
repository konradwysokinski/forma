# Forma — CLAUDE.md

Open-source, local-first view of your running **fitness, fatigue and form**, fed by Strava. A calm, easy-to-scan alternative to Intervals.icu. Built by Konrad (Design Team Lead, product designer) as a portfolio piece showing vibe coding: the code should be clean, the UI calm and polished.

It does one thing well: **am I getting fitter, how tired am I, and is today a day for a hard run.** Not a training planner, not a social feed.

Sister project: **Kilometr** (`../Kilometr`, km on shoes and bikes). Forma copied its stack, tokens, Strava sign-in, storage and i18n, then went its own way. The two apps share no code and no storage; never import across the repos and never edit Kilometr from here.

Design references:
- Form screen mockup (agreed): https://claude.ai/artifact/CAcdFArU8CWHaPhattXZYz, local copy `design/Form.dc.html` (drawn in Kilometr's frame, so its sidebar still says Kilometr). Use it as the visual reference (layout, spacing, copy, states), not as code.
- Kilometr's design system: `../Kilometr/CLAUDE.md` §4 and its `/design-system` page. Forma follows it; differences are in §4 below.

---

## 1. Product decisions

- **Local-first.** Data stays in the user's browser (IndexedDB, `src/lib/db.ts`). No accounts. The only server code is the Strava token exchange (`server/stravaToken.ts`, served as `api/strava/token.ts` on Vercel and as Vite middleware in dev), because the Client Secret must not reach the browser; it stores nothing.
- **Data sources are swappable modules** feeding one `Activity[]` (`src/domain/types.ts`); the model never knows where data came from. Konrad, 2026-11-26: **COROS is meant to be the primary source** (he wears COROS), Strava a fallback for other watches, `.fit` import later. Next step is a COROS spike on Konrad's account before building on it, because COROS's self-service access is unusual:
  - No plain REST API for individual developers: apps connect to COROS's **MCP server** (`https://mcp.coros.com/mcp`; regional `mcpeu.` / `mcpus.` / `mcpcn.`) with OAuth 2.0, single user, no approval needed. Partner API (REST, webhooks) needs a company application (api@coros.com).
  - Tools return formatted text written for AI, not JSON (lap data is JSON); parsing it is fragile.
  - `querySportRecords` (date range, default 20 per call) gives date, sport, distance, duration, pace, but no heart rate; `getActivityDetail` (one call per activity) adds average heart rate. No published rate limit except `.fit` files: 50 per 24 h.
  - COROS's own numbers: `queryTrainingLoadAssessment` (recent days), `queryFitnessAssessmentOverview` (VO2max, threshold pace, race predictions), `queryRecoveryStatus` (current only), `queryRestingHeartRate` (recent days). No history of fitness or fatigue, so Forma keeps computing its own curves.
  - Tokens: access 30 days, refresh 180 days (renewed on each refresh).
  - Docs: github.com/coroslab/COROS-MCP (`docs/en/tools.md`, `faq.md`). Never use community COROS servers built on reverse-engineered endpoints.
  - Any COROS client secret follows the same rule as Strava's: server-side only, set by Konrad, never typed or read by Claude.
- **Own Strava API app** (Konrad, 2026-11-26), not Kilometr's: its own Client ID, callback domain and request limit (100 per 15 min, 1 000 a day, shared by every Forma user). Konrad creates it on strava.com/settings/api. Client ID goes in `STRAVA_CLIENT_ID` and `VITE_STRAVA_CLIENT_ID`, the secret in `STRAVA_CLIENT_SECRET` (`.env.local` locally, Vercel env in production; see `.env.example`). Claude never types, reads or asks for the secret or tokens, and never reads `.env.local`.
- **Platform:** Vite + React 19 + TypeScript + CSS modules, Vercel later (not set up yet), runs on localhost (port 5174, Kilometr has 5173).
- **Data budget:** everything comes from Strava's activity list (`GET /athlete/activities`, 200 a page): moving time, average heart rate, distance, sport type, local start. No per-activity requests: heart-rate streams and best efforts cost one request each and are out unless Konrad agrees.
- **Languages:** English and Polish. First visit follows the browser; the choice is remembered (`forma.locale`). For now the EN | PL switch sits in the sidebar footer; it moves to Settings when Settings exists.
- **Theme:** follows the system until Settings exists. Light and dark tokens are both ready.
- **Status now:** the Form screen on sample data (`src/data/sample.ts`, pinned to 25 Nov 2026). Strava sign-in (`src/strava/auth.ts`) and the activity mapping (`src/strava/mapping.ts`) are in place but not wired into the UI yet.

## 2. The model

All in `src/domain/`, pure and tested.

- **Load per activity** (`load.ts`): Banister TRIMP from moving time and average heart rate. `minutes × HRr × 0.64 × e^(1.92 × HRr)` (women 0.86, 1.67), `HRr = (avg − rest) / (max − rest)`. Without heart rate: the same time at an easy effort (HRr 0.55). Max and resting heart rate are estimated (`estimateAthlete`: hardest average ÷ 0.92, clamped 170–210; rest 50) until Settings lets the athlete set them. Daily load = sum over the day's activities, all sports.
- **Fitness** (CTL): `fitness += (load − fitness) / 42` per day. **Fatigue** (ATL): the same over 7 days. Both start at the average daily load of the first 42 days of history (`startingLoad`), because history never starts from zero training.
- **Form** = (fitness − fatigue) / fitness × 100, from **yesterday's** values, so today's run doesn't change today's form. Not shown for the first 7 days of history.
- **Zones** (`training.ts`): Transition above +20%, Fresh +5 to +20, Grey zone −10 to +5, Optimal −30 to −10, High risk below −30. Boundaries belong to the zone below (exactly +5% is Grey zone).
- **Records** (`records.ts`): 5 km, 10 km, half marathon from whole runs of that distance up to 5% longer, time scaled to the exact distance; longest run. "New" for 30 days. (No best efforts inside longer runs: those need a request per activity.)
- **Easy-pace heart rate** (`easyHr.ts`): per month, time-weighted average heart rate of runs averaging 5:30–6:00 /km. The KPI compares the latest month with two months before.
- **Screen summary** (`formSummary.ts`): one call computes everything the Form screen shows for a period (6 weeks, 3 months, year). Title: today's zone in words plus fitness against last month's average ("Fresh *and fitter than in October*").

## 3. Screens

Built:
1. **Form** (`src/screens/Form.tsx`): title + period switch (6 weeks / 3 months / Year, a boxed segmented control); 4 KPI tiles (Form % with zone chip, Fitness, Fatigue, Easy-pace heart rate), each with one line that explains it; one chart card: fitness line (blue, soft gradient), fatigue line (violet), grey daily-load bars, a dashed line on today, a right column with today's fitness, fatigue and 7-day load; under it form as daily bars coloured by zone over faint zone bands, with the five zones listed on the right (name, range, one sentence); Records and Heart rate at easy pace cards.

Next (not designed yet), roughly in this order, to agree with Konrad:
2. COROS spike (agreed 2026-11-26): sign in from localhost on Konrad's account, list a few months of runs, read real responses, then decide whether COROS via MCP becomes the primary source. Then connect the chosen source (Start screen, first sync, IndexedDB); Strava as the fallback.
3. Settings: max and resting heart rate, easy-pace band, theme, language, remove data.
4. Chart tooltips (hover, tap and arrow keys on a day), as in Kilometr's weekly chart.
5. Records and Activities screens.
6. Vercel project and README screenshots.

---

## 4. Design system

Forma uses Kilometr's design system (`../Kilometr/CLAUDE.md` §4): the same ground, type (Inter 400/500/600, Instrument Serif only for the wordmark "Forma"), spacing, radii, shadows, components (KPI tile, chart card, segmented control, chips) and content rules. Tokens live in `src/styles/tokens.css`.

What differs:
- **No gear colours.** Forma has no gear, so `--gear-*` are gone.
- **Training colours are their own tokens** and are used for nothing else:
  - `--fitness` (#2563EB, line, gradient 18% → 0) and `--fitness-ink`
  - `--fatigue` (#8B5CF6, thinner line) and `--fatigue-ink`
  - `--load` (#E3E5E9, daily load bars, kept quiet behind the lines)
  - `--trend` (ink; the easy-pace heart-rate line)
  - Zones, each with `-ink` (text) and `-tint` (background band): `--zone-transition` (sun #E5A500), `--zone-fresh` (cobalt #2563EB), `--zone-grey` (granite #8A9099), `--zone-optimal` (forest #16A05A), `--zone-risk` (red #E5484D).
  - Zone chip: 12% of the zone colour (`color-mix`) with the zone's ink.
  - Dark values for all of them are in `tokens.css`.
- Colour is never the only identifier: every zone colour sits next to its name; the form bars have the zone legend beside them; the chart has an `aria-label` sentence.
- **Period switch:** the "box" size of `Segmented` (40px, 1px `--line`, radius 12, selected `--selected` fill, 500).
- **New-record chip:** `--accent-soft` with `--accent` text.

Charts are hand-drawn SVG (`src/components/*Chart.tsx`), sized to their container with `useWidth`, sharing x positions (`chartAxis.ts`) so the fitness chart and the form bars line up day for day.

### Content rules

- Plain, short, sentence case; one line under every number saying what it means ("Average load, last 42 days").
- Polish: same tone, real plural forms, decimal comma, locative months with the right preposition ("w październiku", "we wrześniu"), no gendered adjectives about the athlete (zone names are nouns: "Świeżość", "Szara strefa").
- No motivational fluff, no emoji.

### Accessibility

Real buttons and lists; the period and language switches are `radiogroup`s with arrow keys; `aria-label` on every chart describing what it shows; text contrast ≥ 4.5:1; visible focus ring in `--accent`.

---

## 5. Working with Konrad

- Communicates in Polish and English; UI copy exists in both (`src/i18n/en.ts`, `src/i18n/pl.ts`). Every new string goes into both files; TypeScript fails the build if Polish is missing one.
- Plan first: summarise what you're going to do before doing it.
- Commit only after his yes. Never push without asking.
- Warn when a session is getting long and suggest a handoff.
- Keep the repo presentable: README with screenshots, MIT licence, clear structure; it's a portfolio piece.
- Checks: `npm run typecheck`, `npm test`. Node lives in `~/.local/node/bin` (not on the default PATH).
