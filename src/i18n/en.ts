import type { Zone } from '../domain/training';
import type { WeekFeel } from '../domain/formSummary';
import type { Locale } from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
/** "in October"; month is 0–11. */
const inMonth = (month: number) => `in ${MONTHS[month]}`;

export const en = {
  locale: 'en' as Locale,
  languageName: 'English',

  nav: {
    label: 'Main',
    form: 'Form',
    settings: 'Settings',
  },

  sidebar: {
    sampleData: 'Sample data',
    connect: 'Connect COROS',
    /** Short, to fit beside "COROS" in the sidebar. */
    synced: (ago: string) => `Sync ${ago}`,
    syncedJustNow: 'Sync just now',
    syncing: 'Syncing…',
    syncNow: 'Sync with COROS now',
    syncFailed: 'Sync failed',
    retry: 'Try again',
    reconnect: 'Connect again',
  },

  settings: {
    title: 'Settings',
    close: 'Close settings',
    sections: 'Settings sections',
    general: 'General',
    heartRate: 'Heart rate',
    data: 'Data',
    about: 'About',
    theme: 'Theme',
    themeHint: "System follows your computer's light or dark setting.",
    themes: { light: 'Light', dark: 'Dark', system: 'System' },
    language: 'Language',
    languageHint: 'Forma speaks English and Polish.',
    heartRateLead:
      'Load, fitness, fatigue and form are worked out from these. Forma estimates them until you set your own.',
    maxHr: 'Max heart rate',
    maxHrEstimated: (bpm: string) =>
      `Estimated at ${bpm} from your hardest efforts. Set yours if you know it from a test or a race.`,
    maxHrSet: (bpm: string) => `Set by you. The estimate from your activities is ${bpm}.`,
    restHr: 'Resting heart rate',
    restHrCoros: (bpm: string) => `${bpm}, the median of the last 30 days on COROS.`,
    restHrTypical: (bpm: string) => `A typical ${bpm} until you set yours.`,
    restHrSet: (estimate: string) => `Set by you. Without it Forma uses ${estimate}.`,
    easyPace: 'Easy pace',
    easyPaceHint: 'Runs averaging a pace in this band count toward heart rate at easy pace. Pick a pace you often run easy.',
    easyPaceFrom: 'Easy pace from',
    easyPaceTo: 'Easy pace to',
    perKm: '/km',
    useEstimate: 'Use estimate',
    useDefault: 'Reset',
    errors: {
      maxHrRange: 'Enter a whole number from 140 to 230.',
      restHrRange: 'Enter a whole number from 30 to 100.',
      reserve: 'Resting heart rate should be at least 40 below max.',
      paceFormat: 'Enter the pace as minutes and seconds, like 5:30.',
      paceRange: 'Enter a pace from 2:30 to 12:00 per km.',
      paceOrder: 'The first pace should be faster than the second.',
    },
    sourceSample: 'Sample data',
    sourceSampleHint: 'Made-up training to look around with.',
    sourceCoros: 'Connected to COROS',
    sourceCorosHint: (ago: string) =>
      `Synced ${ago}. Forma looks for new activities when you open it and every hour after that.`,
    sourceCorosFirst: 'Fetching your activities for the first time.',
    syncNow: 'Sync now',
    connect: 'Connect COROS',
    disconnect: 'Disconnect COROS',
    disconnectHint:
      'Signs out of COROS and removes its activities from this browser. Your heart-rate settings stay.',
    disconnectButton: 'Disconnect',
    remove: 'Remove all data',
    removeHint: "Deletes everything Forma keeps in this browser. COROS isn't touched.",
    removeTitle: 'Remove all data?',
    removeBody:
      'Activities, the COROS sign-in and your heart-rate settings are deleted from this browser. Nothing changes in COROS, and you can connect again at any time.',
    cancel: 'Cancel',
    aboutHint: (version: string) =>
      `Version ${version}. Open source under the MIT licence. Your data stays in this browser; there is no account and no server that keeps it.`,
    github: 'View on GitHub',
    author: 'Made by',
    authorProfile: 'GitHub profile',
    corosData: 'Data from COROS',
    corosDataHint:
      "Activities, resting heart rate and sex come from your COROS account through COROS's MCP server. Forma is an independent app, not made by COROS.",
    designSystemHint: 'Colours, type and components Forma is built from, live from its own code.',
    designSystemOpen: 'Open',
  },

  start: {
    title: 'Fitness, fatigue and form',
    titleMuted: 'from your own training',
    lead: 'Forma shows whether you are getting fitter, how tired you are, and whether today is a day for a hard run.',
    connectTitle: 'Connect COROS',
    connectBody:
      'Sign in with your COROS account. Forma reads a year of activities, your resting heart rate and sex, for the load formula. Nothing else.',
    connectButton: 'Connect COROS',
    connecting: 'Opening COROS…',
    connectNote: 'Your data stays in this browser: no account, no server.',
    connectFailed: (message: string) => `COROS sign-in didn't start. ${message}`,
    sample: 'Look around with sample data',
    openSource: 'Open source · MIT',
  },

  callback: {
    finishing: 'Finishing sign-in…',
    failed: "Sign-in didn't finish",
    back: 'Back to start',
  },

  firstSync: {
    title: 'Fetching your training',
    titleMuted: 'from COROS',
    body: 'A year of activities, a month at a time. Later syncs only fetch what is new.',
    progressLabel: 'Sync progress',
    failed: 'The sync stopped',
    retry: 'Try again',
    reconnect: 'Connect again',
  },

  period: {
    label: 'Period',
    '6w': '6 weeks',
    '3m': '3 months',
    year: 'Year',
    /** For chart descriptions. */
    over: { '6w': 'over 6 weeks', '3m': 'over 3 months', year: 'over the year' },
  },

  zones: {
    transition: { name: 'Transition', range: '+20% and up', note: 'Rested so long that fitness slips' },
    fresh: { name: 'Fresh', range: '+5 to +20%', note: 'Ready to race or run hard' },
    grey: { name: 'Grey zone', range: '−10 to +5%', note: 'Holding fitness, not building it' },
    optimal: { name: 'Optimal', range: '−30 to −10%', note: 'Tired in the right way: fitness grows' },
    risk: { name: 'High risk', range: 'below −30%', note: 'Rest soon: injury and illness risk' },
  } satisfies Record<Zone, { name: string; range: string; note: string }>,

  zoneGuide: {
    title: 'Form zones',
    open: (zone: string) => `What ${zone} means`,
    close: 'Close',
    intro: [
      'Form compares how fit you are with how tired you are. Fitness is your average daily load over the last 42 days, fatigue the same over the last 7. Form is the gap between them as a share of fitness: when recent training is heavier than usual, fatigue rises above fitness and form goes below zero.',
      'The idea is older than any app: the impulse-response model the sports scientist Eric Banister described in the 1970s, later made common in endurance training by Andrew Coggan\'s Performance Manager. The zone boundaries are a rule of thumb, not a diagnosis; how you feel still counts.',
    ],
    zones: {
      transition:
        'Fatigue has almost gone, and fitness is starting to go with it. A week or two here after a race or a hard block does good: the body repairs and you come back wanting to run. Stay longer and fitness drops week by week; if that is not the plan, add some training.',
      fresh:
        'Rested, with most of your fitness still there. This is where you want to be on race day, usually after easing off for one or two weeks. Good for a race or a hard session; weeks on end here mean you are not training enough to improve.',
      grey:
        'Training and recovery are about even. Fitness holds but hardly grows. Fine for an easy week or between blocks; to improve, the load needs to go up a little.',
      optimal:
        'Recent training is a bit heavier than you are used to, which is what makes fitness grow. Some tiredness here is normal. Keep easy days easy and plan a lighter week every three or four weeks so the work sinks in.',
      risk:
        'Load has climbed much faster than fitness. A day or two here after a race or a very long run is fine; staying here raises the risk of injury, illness and poor sleep. Ease off until form is back above −30%.',
    } satisfies Record<Zone, string>,
  },

  form: {
    title: 'Form',
    /** Today's zone in words, the start of the line under the title. */
    state: {
      transition: 'Well rested',
      fresh: 'Fresh',
      grey: 'Holding steady',
      optimal: 'Building',
      risk: 'Overreaching',
    } satisfies Record<Zone, string>,
    noData: 'Not enough training yet',
    /** Fitness today against last month's average. */
    trend: (change: number, month: number) =>
      change >= 1
        ? `fitter than ${inMonth(month)}`
        : change <= -1
          ? `less fit than ${inMonth(month)}`
          : `as fit as ${inMonth(month)}`,
    /** The line under the title: "Holding steady, less fit than in October." */
    summary: (state: string, trend: string | null) => (trend ? `${state}, ${trend}.` : `${state}.`),

    kpiForm: 'Form',
    /** Days of the period in a good zone, e.g. "Optimal or Fresh on 34 of 91 days". */
    goodDays: (count: number, of: number) => `Optimal or Fresh on ${count} of ${of} ${of === 1 ? 'day' : 'days'}`,
    kpiFitness: 'Fitness',
    fitnessSub: (change: string, over: string) => `${change} ${over}, from 42 days of training`,
    kpiFatigue: 'Fatigue',
    fatigueSub: (week: WeekFeel) =>
      ({ easy: 'From the last 7 days, an easy week', steady: 'From the last 7 days, a steady week', hard: 'From the last 7 days, a hard week' })[week],
    kpiEasyHr: 'Easy-pace heart rate',
    bpm: 'bpm',
    easyHrSub: (pace: string, change: number | null, month: number) =>
      change === null
        ? `At ${pace}`
        : change < 0
          ? `At ${pace}, ${-change} bpm lower than ${inMonth(month)}`
          : change > 0
            ? `At ${pace}, ${change} bpm higher than ${inMonth(month)}`
            : `At ${pace}, the same as ${inMonth(month)}`,
    easyHrNone: 'No easy runs with heart rate yet',

    chartTitle: 'Fitness, fatigue and form',
    fitness: 'Fitness',
    fitnessNote: 'Average load, last 42 days',
    fatigue: 'Fatigue',
    fatigueNote: 'Average load, last 7 days',
    load: 'Daily load',
    loadNote: 'From time and heart rate per activity',
    chartAria: (from: string, to: string, fatigue: string, over: string) =>
      `Fitness went from ${from} to ${to} ${over}; fatigue is ${fatigue} today. Grey bars show each day's load.`,

    formHeading: 'Form',
    formHeadingNote: '% of fitness, per day',
    formAria: (over: string, today: string, zone: string) => `Daily form ${over}, by zone. Today ${today}%, ${zone}.`,
    zonesLabel: 'Form zones',
    /** The charts as one focusable area: arrow keys move a day. */
    exploreLabel: 'Fitness, fatigue and form by day. Arrow keys move a day, Escape closes.',
    dayLoad: 'Load',
    restDay: 'No activities',
    moreActivities: (n: number) => `+${n} more`,
  },

  records: {
    title: 'Records',
    '5k': '5 km',
    '10k': '10 km',
    half: 'Half marathon',
    marathon: 'Marathon',
    longest: 'Longest run',
    /** Under the title: which runs the records come from. */
    note: { '6w': 'Best whole runs in the last 6 weeks', '3m': 'Best whole runs in the last 3 months', year: 'Best whole runs in the last year' },
    isNew: (date: string) => `New · ${date}`,
    none: 'None in this period',
    heartRateLabel: 'Average heart rate',
  },

  easyHr: {
    title: 'Heart rate at easy pace',
    note: (from: string, to: string) => `Average on runs at ${from}–${to} /km. Lower at the same pace means fitter.`,
    aria: (first: string, from: string, last: string, to: string) =>
      `Easy-pace heart rate went from ${first} bpm in ${from} to ${last} bpm in ${to}.`,
    empty: 'No easy runs with heart rate in these months.',
  },

  ds: {
    title: 'Design system',
    lead: "The tokens and components Forma is built from, rendered from the app's own code with sample data. Switch the theme to see both.",
    openApp: 'Open Forma',
    principlesTitle: 'Principles',
    principles: [
      'One question, answered calmly: am I getting fitter, how tired am I, is today a day for a hard run.',
      'A navy ground with one white panel floating on it. Cards inside have a 1px border and no shadow.',
      'Big tabular numbers with one line under each that says what it means.',
      'Training colours mean one thing each: blue is fitness, violet fatigue, red heart rate, and five colours for the form zones. Nothing else uses them.',
      'Restraint: light weights (400 and 500), generous space, soft borders, pills, colour as soft tints.',
    ],
    colours: 'Colours',
    coloursHint: 'Every value is read from tokens.css, the file the app loads. Light and dark side by side.',
    name: 'Token',
    ground: 'Ground',
    text: 'Text',
    accent: 'Accent',
    accentHint: 'Moss, the one brand colour: primary buttons, links, focus ring, the new-record chip.',
    states: 'States',
    sidebar: 'Sidebar',
    sidebarHint: 'The navy ground. The sidebar redefines ink, muted ink, hover, selected and accent to these, so its rows need no rules of their own.',
    training: 'Training',
    trainingHint: 'Fitness, fatigue, daily load and heart rate. Used for these measures only; -ink for text.',
    zones: 'Form zones',
    zonesHint: 'Each zone has a bar colour, an -ink for text and a -tint for its band on the chart.',
    type: 'Type',
    typeHint: 'Inter 400 and 500 for everything, 600 only for small caps like COROS. Instrument Serif only for the wordmark. Numbers are tabular.',
    style: 'Style',
    size: 'Size / line',
    weight: 'Weight',
    tracking: 'Tracking',
    sample: 'Fitness, fatigue and form',
    typeUse: {
      wordmark: 'Forma in the sidebar',
      title: 'screen titles',
      kpi: 'KPI tile values',
      number: 'record times',
      heading: 'card titles',
      subheading: 'chart subtitles',
      lead: 'the state line by the title',
      body: 'text, buttons, labels',
      caption: 'notes, legend, sidebar status',
      small: 'chart labels, chips',
    },
    spacing: 'Spacing',
    spacingHint: 'A 4px grid. Tiles and cards on the Form screen sit 12px apart.',
    radii: 'Radii',
    radiiHint: 'Rounder as things get bigger: rows, controls, tiles, cards.',
    shadows: 'Shadows',
    shadowsHint: 'Only for things that float: the panel, the tooltip, dialogs.',
    components: 'Components',
    sampleNote: 'Rendered by the app\'s own components, on the sample data.',
    kpis: 'KPI tiles',
    kpisHint: "Today's value in the colour of its line or zone, one line under it. The heart marks heart rate.",
    segmented: 'Segmented control',
    segmentedHint: 'A radiogroup: one tab stop, arrow keys move. sm for language, md for settings, box for the period.',
    buttons: 'Buttons',
    buttonsHint: '40px, radius 12; 44px for the main call to action. Primary in moss, secondary outlined, text for quiet actions.',
    primary: 'Save',
    secondary: 'Cancel',
    chips: 'Chips',
    chipsHint: '12% of the zone colour with its ink. New records in moss.',
    legends: 'Legends',
    legendsHint: "The chart's key in one row; the zones in three lines each. A zone's name opens the zone guide.",
    charts: 'Charts',
    chartsHint: 'Hand-drawn SVG sized to the card. Fitness and form share their x positions, so they line up day for day. Every chart has an aria-label sentence.',
    tooltip: 'Day tooltip',
    tooltipHint: 'Follows the pointer or the arrow keys over the charts. Screen readers hear the same as one sentence.',
    dialog: 'Confirm dialog',
    dialogHint: 'A native modal dialog. Cancel has focus first; destructive actions use the danger colour.',
    openDialog: 'Open dialog',
    settingsRow: 'Settings row',
    settingsRowHint: 'Title, a hint under it, the control on the right. Errors in words under the hint.',
    sidebarRows: 'Sidebar rows',
    sidebarRowsHint: 'Nav rows 38px, radius 10; the active row is filled and 500. Source status with a 7px dot.',
    activities: 'Activities',
    activitiesNote: 'The Activities screen is being built. Its list and rows join this page once it lands.',
    content: 'Content',
    contentRules: [
      'Plain, short, sentence case.',
      'One line under every number saying what it means: "Average load, last 42 days".',
      'Polish in the same tone, with real plural forms, a decimal comma and months in the locative ("w październiku").',
      'No gendered adjectives about the athlete; zone names are nouns.',
      'No motivational fluff, no emoji.',
    ],
    a11y: 'Accessibility',
    a11yRules: [
      'Real buttons, links, inputs with labels and lists.',
      'Period and language switches are radiogroups with arrow keys.',
      'Every chart has an aria-label that says what it shows.',
      'Colour is never the only sign: each zone colour sits next to its name.',
      'Text contrast at least 4.5:1; a visible focus ring in the accent colour.',
      'Motion stays small and stops when the system asks for reduced motion.',
    ],
  },
};

export type Messages = typeof en;
