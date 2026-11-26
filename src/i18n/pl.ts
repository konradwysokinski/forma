import type { Messages } from './en';
import type { Locale } from './types';

/** "w październiku", "we wrześniu"; month is 0–11. */
const IN_MONTH = [
  'w styczniu', 'w lutym', 'w marcu', 'w kwietniu', 'w maju', 'w czerwcu',
  'w lipcu', 'w sierpniu', 'we wrześniu', 'w październiku', 'w listopadzie', 'w grudniu',
];
const inMonth = (month: number) => IN_MONTH[month]!;

export const pl: Messages = {
  locale: 'pl' as Locale,
  languageName: 'Polski',

  nav: {
    label: 'Główne',
    form: 'Forma',
    language: 'Język',
  },

  sidebar: {
    sampleData: 'Przykładowe dane',
  },

  period: {
    label: 'Okres',
    '6w': '6 tygodni',
    '3m': '3 miesiące',
    year: 'Rok',
    over: { '6w': 'w ciągu 6 tygodni', '3m': 'w ciągu 3 miesięcy', year: 'w ciągu roku' },
  },

  zones: {
    transition: { name: 'Roztrenowanie', range: '+20% i więcej', note: 'Odpoczynek tak długi, że kondycja spada' },
    fresh: { name: 'Świeżość', range: '+5 do +20%', note: 'Czas na start albo mocny bieg' },
    grey: { name: 'Szara strefa', range: '−10 do +5%', note: 'Kondycja się trzyma, ale nie rośnie' },
    optimal: { name: 'Optymalnie', range: '−30 do −10%', note: 'Dobre zmęczenie: kondycja rośnie' },
    risk: { name: 'Wysokie ryzyko', range: 'poniżej −30%', note: 'Pora odpocząć: ryzyko kontuzji i choroby' },
  },

  form: {
    state: {
      transition: 'Długi odpoczynek',
      fresh: 'Świeżość',
      grey: 'Bez zmian',
      optimal: 'Budowanie formy',
      risk: 'Przeciążenie',
    },
    noData: 'Za mało treningów',
    trend: (change, month) =>
      change >= 1
        ? `i kondycja lepsza niż ${inMonth(month)}`
        : change <= -1
          ? `i kondycja słabsza niż ${inMonth(month)}`
          : `i kondycja taka jak ${inMonth(month)}`,

    kpiForm: 'Forma',
    formSub: (zone, gap) =>
      ({
        transition: `Zmęczenie ${gap} poniżej kondycji: czas wrócić do treningu`,
        fresh: `Zmęczenie ${gap} poniżej kondycji: jest miejsce na mocny bieg`,
        grey: 'Zmęczenie blisko kondycji: bez zmian',
        optimal: `Zmęczenie ${gap} powyżej kondycji: budujesz, zgodnie z planem`,
        risk: `Zmęczenie ${gap} powyżej kondycji: czas odpocząć`,
      })[zone],
    kpiFitness: 'Kondycja',
    fitnessSub: (change) => `${change} w 6 tygodni, z 42 dni treningu`,
    kpiFatigue: 'Zmęczenie',
    fatigueSub: (week) =>
      ({ easy: 'Z ostatnich 7 dni, lekki tydzień', steady: 'Z ostatnich 7 dni, równy tydzień', hard: 'Z ostatnich 7 dni, ciężki tydzień' })[week],
    kpiEasyHr: 'Tętno w spokojnym tempie',
    bpm: 'bpm',
    easyHrSub: (pace, change, month) =>
      change === null
        ? `Przy ${pace}`
        : change < 0
          ? `Przy ${pace}, o ${-change} bpm niższe niż ${inMonth(month)}`
          : change > 0
            ? `Przy ${pace}, o ${change} bpm wyższe niż ${inMonth(month)}`
            : `Przy ${pace}, takie samo jak ${inMonth(month)}`,
    easyHrNone: 'Brak spokojnych biegów z tętnem',

    chartTitle: 'Kondycja, zmęczenie i forma',
    today: (date) => `Dziś, ${date}`,
    fitness: 'Kondycja',
    fitnessNote: 'Średnie obciążenie, ostatnie 42 dni',
    fatigue: 'Zmęczenie',
    fatigueNote: 'Średnie obciążenie, ostatnie 7 dni',
    load7: 'Obciążenie, 7 dni',
    load7Note: 'Z czasu i tętna każdego treningu',
    chartAria: (from, to, fatigue, over) =>
      `Kondycja zmieniła się z ${from} na ${to} ${over}; zmęczenie dziś ${fatigue}. Szare słupki to obciążenie każdego dnia.`,

    formHeading: 'Forma',
    formHeadingNote: '% kondycji, dzień po dniu',
    formAria: (over, today, zone) => `Forma dzień po dniu ${over}, według stref. Dziś ${today}%, ${zone}.`,
    zonesLabel: 'Strefy formy',
  },

  records: {
    title: 'Rekordy',
    '5k': '5 km',
    '10k': '10 km',
    half: 'Półmaraton',
    longest: 'Najdłuższy bieg',
    isNew: (date) => `Nowy · ${date}`,
    none: 'Jeszcze brak',
  },

  easyHr: {
    title: 'Tętno w spokojnym tempie',
    note: (from, to) => `Średnia z biegów w tempie ${from}–${to} /km. Niższe przy tym samym tempie to lepsza kondycja.`,
    aria: (first, from, last, to) => `Tętno w spokojnym tempie: ${first} bpm (${from}), ${last} bpm (${to}).`,
    empty: 'Brak spokojnych biegów z tętnem w tych miesiącach.',
  },
};
