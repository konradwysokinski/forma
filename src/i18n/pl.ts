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
    settings: 'Ustawienia',
  },

  sidebar: {
    sampleData: 'Przykładowe dane',
    connect: 'Połącz COROS',
    synced: (ago) => `Zsynchronizowano ${ago}`,
    syncedJustNow: 'Zsynchronizowano teraz',
    syncing: 'Synchronizacja…',
    syncNow: 'Synchronizuj z COROS teraz',
    syncFailed: 'Błąd synchronizacji',
    retry: 'Spróbuj ponownie',
    reconnect: 'Połącz ponownie',
  },

  settings: {
    title: 'Ustawienia',
    close: 'Zamknij ustawienia',
    sections: 'Sekcje ustawień',
    general: 'Ogólne',
    heartRate: 'Tętno',
    data: 'Dane',
    about: 'O Formie',
    theme: 'Motyw',
    themeHint: 'Systemowy idzie za jasnym lub ciemnym trybem komputera.',
    themes: { light: 'Jasny', dark: 'Ciemny', system: 'Systemowy' },
    language: 'Język',
    languageHint: 'Forma mówi po angielsku i po polsku.',
    heartRateLead:
      'Z tych wartości liczone są obciążenie, kondycja, zmęczenie i forma. Dopóki nie ustawisz własnych, Forma je szacuje.',
    maxHr: 'Tętno maksymalne',
    maxHrEstimated: (bpm) =>
      `Szacowane na ${bpm} z najmocniejszych wysiłków. Ustaw własne, jeśli znasz je z testu albo zawodów.`,
    maxHrSet: (bpm) => `Ustawione przez Ciebie. Szacunek z aktywności to ${bpm}.`,
    restHr: 'Tętno spoczynkowe',
    restHrCoros: (bpm) => `${bpm}, mediana z ostatnich 30 dni w COROS.`,
    restHrTypical: (bpm) => `Typowe ${bpm}, dopóki nie ustawisz własnego.`,
    restHrSet: (estimate) => `Ustawione przez Ciebie. Bez tego Forma bierze ${estimate}.`,
    easyPace: 'Łatwe tempo',
    easyPaceHint:
      'Biegi ze średnim tempem w tym przedziale liczą się do tętna przy łatwym tempie. Wybierz tempo, w którym często biegasz spokojnie.',
    easyPaceFrom: 'Łatwe tempo od',
    easyPaceTo: 'Łatwe tempo do',
    perKm: '/km',
    useEstimate: 'Użyj szacunku',
    useDefault: 'Przywróć',
    errors: {
      maxHrRange: 'Wpisz liczbę całkowitą od 140 do 230.',
      restHrRange: 'Wpisz liczbę całkowitą od 30 do 100.',
      reserve: 'Tętno spoczynkowe powinno być co najmniej o 40 niższe od maksymalnego.',
      paceFormat: 'Wpisz tempo jako minuty i sekundy, np. 5:30.',
      paceRange: 'Wpisz tempo od 2:30 do 12:00 na km.',
      paceOrder: 'Pierwsze tempo powinno być szybsze od drugiego.',
    },
    sourceSample: 'Przykładowe dane',
    sourceSampleHint: 'Zmyślone treningi do rozejrzenia się.',
    sourceCoros: 'Połączono z COROS',
    sourceCorosHint: (ago) =>
      `Zsynchronizowano ${ago}. Forma szuka nowych aktywności przy otwarciu i potem co godzinę.`,
    sourceCorosFirst: 'Pierwsze pobieranie aktywności.',
    syncNow: 'Synchronizuj',
    connect: 'Połącz COROS',
    disconnect: 'Odłącz COROS',
    disconnectHint: 'Wylogowuje z COROS i usuwa jego aktywności z tej przeglądarki. Ustawienia tętna zostają.',
    disconnectButton: 'Odłącz',
    remove: 'Usuń wszystkie dane',
    removeHint: 'Usuwa wszystko, co Forma trzyma w tej przeglądarce. W COROS nic się nie zmienia.',
    removeTitle: 'Usunąć wszystkie dane?',
    removeBody:
      'Aktywności, logowanie do COROS i ustawienia tętna znikną z tej przeglądarki. W COROS nic się nie zmienia i w każdej chwili możesz połączyć się ponownie.',
    cancel: 'Anuluj',
    aboutHint: (version) =>
      `Wersja ${version}. Open source na licencji MIT. Dane zostają w tej przeglądarce: bez konta i bez serwera, który by je trzymał.`,
    github: 'Zobacz na GitHubie',
    author: 'Autor',
    authorProfile: 'Profil na GitHubie',
    corosData: 'Dane z COROS',
    corosDataHint:
      'Aktywności, tętno spoczynkowe i płeć pochodzą z Twojego konta COROS przez serwer MCP COROS. Forma to niezależna aplikacja, nie jest dziełem COROS.',
  },

  start: {
    title: 'Kondycja, zmęczenie i forma',
    titleMuted: 'z Twoich treningów',
    lead: 'Forma pokazuje, czy kondycja rośnie, jak duże jest zmęczenie i czy dziś jest dzień na mocny bieg.',
    connectTitle: 'Połącz COROS',
    connectBody:
      'Zaloguj się kontem COROS. Forma pobiera aktywności z ostatniego roku, tętno spoczynkowe i płeć, potrzebne do wzoru na obciążenie. Nic więcej.',
    connectButton: 'Połącz COROS',
    connecting: 'Otwieranie COROS…',
    connectNote: 'Dane zostają w tej przeglądarce: bez konta, bez serwera.',
    connectFailed: (message) => `Nie udało się otworzyć logowania COROS. ${message}`,
    sample: 'Zobacz na przykładowych danych',
    openSource: 'Open source · MIT',
  },

  callback: {
    finishing: 'Kończenie logowania…',
    failed: 'Logowanie się nie powiodło',
    back: 'Wróć do startu',
  },

  firstSync: {
    title: 'Pobieranie treningów',
    titleMuted: 'z COROS',
    body: 'Rok aktywności, miesiąc po miesiącu. Kolejne synchronizacje pobierają tylko nowe.',
    progressLabel: 'Postęp synchronizacji',
    failed: 'Synchronizacja się przerwała',
    retry: 'Spróbuj ponownie',
    reconnect: 'Połącz ponownie',
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
    goodDays: (count, of) => `Optymalnie lub Świeżość przez ${count} z ${of} ${of === 1 ? 'dnia' : 'dni'}`,
    kpiFitness: 'Kondycja',
    fitnessSub: (change, over) => `${change} ${over}, z 42 dni treningu`,
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
    fitness: 'Kondycja',
    fitnessNote: 'Średnie obciążenie, ostatnie 42 dni',
    fatigue: 'Zmęczenie',
    fatigueNote: 'Średnie obciążenie, ostatnie 7 dni',
    load: 'Obciążenie dzienne',
    loadNote: 'Z czasu i tętna każdego treningu',
    chartAria: (from, to, fatigue, over) =>
      `Kondycja zmieniła się z ${from} na ${to} ${over}; zmęczenie dziś ${fatigue}. Szare słupki to obciążenie każdego dnia.`,

    formHeading: 'Forma',
    formHeadingNote: '% kondycji, dzień po dniu',
    formAria: (over, today, zone) => `Forma dzień po dniu ${over}, według stref. Dziś ${today}%, ${zone}.`,
    zonesLabel: 'Strefy formy',
    exploreLabel: 'Kondycja, zmęczenie i forma dzień po dniu. Strzałki przesuwają o dzień, Escape zamyka.',
    dayLoad: 'Obciążenie',
    restDay: 'Bez treningu',
    moreActivities: (n) => `+${n} więcej`,
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
