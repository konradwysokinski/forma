# Forma

A calm, easy-to-read view of your running **fitness, fatigue and form**, fed by Strava. Local-first: your data stays in your browser.

- **Fitness**: your average training load over the last 42 days.
- **Fatigue**: the same over the last 7 days.
- **Form**: how far fatigue sits below or above fitness, as a share of fitness, in five zones from High risk to Transition.
- **Records** (5 km, 10 km, half marathon, longest run) and **heart rate at easy pace**, month by month: lower at the same pace means fitter.

Load comes from each activity's moving time and average heart rate (Banister TRIMP), so Forma reads only Strava's activity list, with no request per activity.

> Status: the Form screen runs on sample data. Connecting Strava is next.

## Run it

```bash
npm install
npm run dev   # http://localhost:5174
npm test
```

To sign in with Strava locally, copy `.env.example` to `.env.local` and fill in your own Strava API app's Client ID and secret.

## Built with

Vite, React 19, TypeScript, CSS modules. Design system shared with its sister project, [Kilometr](https://kilometr-roan.vercel.app).

## Licence

MIT
