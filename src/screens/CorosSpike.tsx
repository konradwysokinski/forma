/**
 * Development-only test page for COROS (/coros): sign in, then see COROS's raw
 * replies, to decide whether COROS can be Forma's main data source. Not part
 * of the product, so its copy is English only and outside src/i18n.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { callTool, initialize, listTools } from '../coros/mcp';
import { corosTokens, finishCorosSignIn, forgetCoros, startCorosSignIn, type CorosTokens } from '../coros/oauth';
import s from './CorosSpike.module.css';

interface Entry {
  title: string;
  body: string;
}

const yyyymmdd = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '');
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

/** The checks that answer our questions, in order. */
const CHECKS: { title: string; tool: string; args: () => Record<string, unknown> }[] = [
  { title: 'Runs, last 90 days', tool: 'querySportRecords', args: () => ({ startDate: yyyymmdd(daysAgo(90)), endDate: yyyymmdd(new Date()), limit: 100 }) },
  { title: 'Training load, last 42 days', tool: 'queryTrainingLoadAssessment', args: () => ({ days: 42 }) },
  { title: 'Fitness assessment', tool: 'queryFitnessAssessmentOverview', args: () => ({}) },
  { title: 'Resting heart rate, last 30 days', tool: 'queryRestingHeartRate', args: () => ({ days: 30 }) },
  { title: 'Recovery', tool: 'queryRecoveryStatus', args: () => ({}) },
];

const show = (result: unknown) => JSON.stringify(result, null, 2);

export function CorosSpike() {
  const [tokens, setTokens] = useState<CorosTokens | null>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<Entry[]>([]);
  const [tool, setTool] = useState('getActivityDetail');
  const [args, setArgs] = useState('{ "labelId": "", "sportType": 100 }');

  useEffect(() => {
    corosTokens().then(setTokens, (e: Error) => setLog([{ title: 'Saved sign-in', body: e.message }]));
  }, []);

  const add = (title: string, body: string) => setLog((l) => [...l, { title, body }]);

  async function run<T>(title: string, task: () => Promise<T>) {
    try {
      add(title, show(await task()));
    } catch (e) {
      add(`${title} (failed)`, (e as Error).message);
    }
  }

  async function runChecks() {
    if (!tokens) return;
    setBusy(true);
    setLog([]);
    await run('Server', () => initialize(tokens));
    await run('Tools', async () => (await listTools(tokens)).tools.map((t) => t.name));
    for (const c of CHECKS) await run(`${c.title} · ${c.tool}`, () => callTool(tokens, c.tool, c.args()));
    setBusy(false);
  }

  async function callOne() {
    if (!tokens) return;
    setBusy(true);
    try {
      await run(tool, () => callTool(tokens, tool, JSON.parse(args) as Record<string, unknown>));
    } catch (e) {
      add(`${tool} (bad arguments)`, (e as Error).message);
    }
    setBusy(false);
  }

  return (
    <>
      <header className={s.header}>
        <h1 className={s.title}>
          COROS <span className={s.muted}>test page</span>
        </h1>
        <p className={s.muted}>
          Development only. Sign in with your COROS account, then see what COROS sends back. Nothing leaves this browser
          except the calls to COROS.
        </p>
      </header>

      <div className={s.row}>
        {tokens ? (
          <>
            <span className={s.status}>
              <span className={s.dot} aria-hidden="true" />
              Connected to {new URL(tokens.resource).host}
            </span>
            <button type="button" className={s.primary} onClick={runChecks} disabled={busy}>
              {busy ? 'Asking COROS…' : 'Run checks'}
            </button>
            <button
              type="button"
              className={s.secondary}
              onClick={() => {
                forgetCoros();
                setTokens(null);
              }}
            >
              Forget sign-in
            </button>
          </>
        ) : (
          <button
            type="button"
            className={s.primary}
            onClick={() => startCorosSignIn().catch((e: Error) => add('Sign-in (failed)', e.message))}
          >
            Connect COROS
          </button>
        )}
      </div>

      {tokens && (
        <div className={s.row}>
          <label className={s.field}>
            <span className={s.muted}>Tool</span>
            <input value={tool} onChange={(e) => setTool(e.target.value)} className={s.input} />
          </label>
          <label className={`${s.field} ${s.grow}`}>
            <span className={s.muted}>Arguments (JSON)</span>
            <input value={args} onChange={(e) => setArgs(e.target.value)} className={s.input} />
          </label>
          <button type="button" className={s.secondary} onClick={callOne} disabled={busy}>
            Call
          </button>
        </div>
      )}

      {log.map((e, i) => (
        <section key={i} className={s.entry}>
          <h2 className={s.entryTitle}>{e.title}</h2>
          <pre className={s.pre}>{e.body}</pre>
        </section>
      ))}
    </>
  );
}

/** COROS sends the athlete back here with a one-time code. */
export function CorosCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return; // the code works once; StrictMode runs effects twice
    started.current = true;
    finishCorosSignIn(window.location.search).then(
      () => navigate('/coros', { replace: true }),
      (e: Error) => setError(e.message),
    );
  }, [navigate]);
  return <p className={s.muted}>{error ?? 'Finishing sign-in…'}</p>;
}
