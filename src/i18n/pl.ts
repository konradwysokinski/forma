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
    activities: 'Aktywności',
    settings: 'Ustawienia',
  },

  sidebar: {
    sampleData: 'Przykładowe dane',
    connect: 'Połącz COROS',
    synced: (ago) => `Sync ${ago}`,
    syncedJustNow: 'Sync przed chwilą',
    syncing: 'Synchronizacja…',
    syncNow: 'Synchronizuj z COROS teraz',
    syncFailed: 'Błąd synchronizacji',
    retry: 'Spróbuj ponownie',
    reconnect: 'Połącz ponownie',
    elevation: (done, total) => `Przewyższenia ${done} z ${total}`,
    elevationHint: 'Pobieram przewyższenia biegów, po jednym. Synchronizuj teraz z COROS.',
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
    designSystemHint: 'Kolory, typografia i komponenty, z których zbudowana jest Forma, wprost z jej kodu.',
    designSystemOpen: 'Otwórz',
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
    '6m': '6 miesięcy',
    year: 'Rok',
    short: { '6w': '6T', '3m': '3M', '6m': '6M', year: 'Rok' },
    over: { '6w': 'w ciągu 6 tygodni', '3m': 'w ciągu 3 miesięcy', '6m': 'w ciągu 6 miesięcy', year: 'w ciągu roku' },
  },

  zones: {
    transition: { name: 'Roztrenowanie', range: '+20% i więcej', note: 'Odpoczynek tak długi, że kondycja spada' },
    fresh: { name: 'Świeżość', range: '+5 do +20%', note: 'Czas na start albo mocny bieg' },
    grey: { name: 'Szara strefa', range: '−10 do +5%', note: 'Kondycja się trzyma, ale nie rośnie' },
    optimal: { name: 'Optymalnie', range: '−30 do −10%', note: 'Dobre zmęczenie: kondycja rośnie' },
    risk: { name: 'Wysokie ryzyko', range: 'poniżej −30%', note: 'Pora odpocząć: ryzyko kontuzji i choroby' },
  },

  zoneGuide: {
    title: 'Strefy formy',
    open: 'Jak działa forma i jej strefy',
    about: 'Jak to działa',
    sections: 'Części przewodnika',
    close: 'Zamknij',
    intro: [
      'Forma porównuje kondycję ze zmęczeniem. Kondycja to średnie dzienne obciążenie z ostatnich 42 dni, zmęczenie to samo z ostatnich 7. Forma to różnica między nimi jako procent kondycji: kiedy ostatnie treningi są cięższe niż zwykle, zmęczenie przerasta kondycję i forma spada poniżej zera.',
      'To starszy pomysł niż jakakolwiek aplikacja: model impuls–odpowiedź, który fizjolog sportu Eric Banister opisał w latach 70., spopularyzowany w sportach wytrzymałościowych przez Performance Manager Andrew Coggana. Granice stref to reguła kciuka, nie diagnoza; samopoczucie nadal się liczy.',
    ],
    zones: {
      transition:
        'Zmęczenie prawie zniknęło, a razem z nim zaczyna ubywać kondycji. Tydzień lub dwa tutaj po zawodach albo mocnym bloku robi dobrze: organizm się regeneruje i wraca chęć do biegania. Dłużej, a kondycja spada z tygodnia na tydzień; jeśli to nie jest plan, dołóż treningu.',
      fresh:
        'Wypoczęcie przy zachowanej większości kondycji. Tu warto być w dniu zawodów, zwykle po tygodniu lub dwóch lżejszego treningu. Dobre na start albo mocny trening; całe tygodnie tutaj oznaczają, że trening jest za mały, żeby robić postępy.',
      grey:
        'Trening i regeneracja mniej więcej się równoważą. Kondycja się trzyma, ale prawie nie rośnie. W porządku na lżejszy tydzień albo między blokami; żeby robić postępy, obciążenie musi trochę wzrosnąć.',
      optimal:
        'Ostatnie treningi są trochę cięższe niż zwykle i właśnie dlatego kondycja rośnie. Lekkie zmęczenie jest tu normalne. Łatwe dni niech zostaną łatwe, a co trzy, cztery tygodnie zaplanuj lżejszy tydzień, żeby praca się utrwaliła.',
      risk:
        'Obciążenie rośnie dużo szybciej niż kondycja. Dzień lub dwa tutaj po zawodach albo bardzo długim biegu to nic złego; dłuższy pobyt zwiększa ryzyko kontuzji, choroby i słabego snu. Zwolnij, aż forma wróci powyżej −30%.',
    },
  },

  form: {
    title: 'Forma',
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
        ? `kondycja lepsza niż ${inMonth(month)}`
        : change <= -1
          ? `kondycja słabsza niż ${inMonth(month)}`
          : `kondycja taka jak ${inMonth(month)}`,
    summary: (state, trend) => (trend ? `${state}, ${trend}.` : `${state}.`),

    kpiForm: 'Forma',
    goodDays: (count, of) => `Optymalnie lub Świeżość przez ${count} z ${of} ${of === 1 ? 'dnia' : 'dni'}`,
    kpiFitness: 'Kondycja',
    fitnessSub: (change, over) => `${change} ${over}, z 42 dni treningu`,
    kpiFatigue: 'Zmęczenie',
    fatigueSub: (week) =>
      ({ easy: 'Z ostatnich 7 dni, lekki tydzień', steady: 'Z ostatnich 7 dni, równy tydzień', hard: 'Z ostatnich 7 dni, ciężki tydzień' })[week],
    kpiEasyHr: 'Tętno spokojne',
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

  today: {
    headline: {
      harder: [
        'Hej, dziś dobry dzień na mocniejszy trening',
        'Siema, dziś możesz dołożyć',
        'Dobry dzień na mocniejszy trening',
        'Hej, nogi gotowe na mocniejszą robotę',
        'Elo, dziś śmiało dociśnij',
        'Dziś jest dzień na jakość',
      ],
      easy: [
        'Hej, dziś spokojnie',
        'Siema, dziś na luzie',
        'Dziś spokojne kilometry',
        'Hej, dziś bez szarżowania',
        'Elo, dziś lekko',
        'Spokojny dzień, spokojne tempo',
      ],
      rest: [
        'Hej, dziś odpocznij',
        'Siema, dziś dzień wolny',
        'Dziś dzień na odpoczynek',
        'Hej, dziś odpuść',
        'Elo, dziś regeneracja',
        'Dziś odpoczynek, jutro bieganie',
      ],
    },
    advice: {
      harder: [
        'Interwały, tempo albo podbiegi dziś dobrze wejdą.',
        'Odpoczynku wystarczy na mocniejszą pracę.',
        'Dobry dzień, żeby docisnąć: organizm jest gotowy.',
        'Świeże nogi: wykorzystaj je na szybszy bieg.',
        'Jeśli w planie jest mocny trening, dziś mu sprzyja.',
        'Gotowość do pracy: bieg z narastającym tempem albo przebieżki.',
      ],
      easy: [
        'Spokojny albo krótki bieg; mocny trening zostaw na inny dzień.',
        'Biegnij, jeśli masz ochotę, w tempie pozwalającym rozmawiać.',
        'Coś lekkiego dziś utrzyma tydzień w równowadze.',
        'Dziś spokojne kilometry; mocniejsze poczekają.',
        'Niski wysiłek, a bieg może być krótki.',
        'To nie dzień na szybkość: wystarczy spokojny bieg albo rower.',
      ],
      rest: [
        'Zrób dzień wolny albo idź na spacer; trening potrzebuje czasu.',
        'Dzień bez biegania da dziś więcej niż mocny trening.',
        'Odpocznij teraz, a następny mocny trening da więcej.',
        'Organizm prosi o przerwę; daj mu ją.',
        'Rozciąganie, spacer, dobry sen: to dziś jest trening.',
        'Odpuść dziś bieg, a jutro wróć z zapasem sił.',
      ],
    },
    rating: { good: 'Dobrze', neutral: 'Bez zmian', poor: 'Uwaga' },
    form: (zoneName, zone) =>
      `${zoneName}: ${
        {
          transition: 'dużo odpoczynku, kondycja spada',
          fresh: 'zmęczenie poniżej kondycji',
          grey: 'zmęczenie równe kondycji',
          optimal: 'zmęczenie ponad kondycją',
          risk: 'zmęczenie dużo ponad kondycją',
        }[zone]
      }`,
    load: (level, load, usual) =>
      `Obciążenie tygodnia ${{ low: 'niskie', normal: 'zwykłe', high: 'wysokie' }[level]}: ${load}, zwykle ${usual}`,
    restHr: (bpm, change) =>
      `Tętno rano ${bpm}, ${change === 0 ? 'jak zwykle' : `${Math.abs(change)} ${change > 0 ? 'powyżej' : 'poniżej'} średniej`}`,
    sleep: (hours, change, diff) =>
      `Sen ${hours}${change === null ? '' : Math.abs(change) < 15 ? ', jak zwykle' : `, ${diff} ${change > 0 ? 'dłużej' : 'krócej'} niż zwykle`}`,
  },
  restHr: {
    toggle: 'Tętno spoczynkowe',
    heading: 'Tętno spoczynkowe',
    headingNote: 'każdego ranka; kilka uderzeń wyżej to słabsza regeneracja',
    average: (bpm) => `Średnio ${bpm}`,
    none: 'Brak tętna spoczynkowego w tym okresie',
    aria: (over, average) => `Tętno spoczynkowe każdego ranka ${over}. Średnio ${average}.`,
  },
  sleep: {
    alsoShow: 'Pokaż też',
    toggle: 'Sen',
    heading: 'Sen',
    headingNote: 'godziny snu, ciemniej przy lepszej ocenie snu',
    average: (hours) => `Średnio ${hours}`,
    none: 'Brak danych o śnie w tym okresie',
    aria: (over, average) => `Godziny snu każdej nocy ${over}, odcień według oceny snu. Średnio ${average}.`,
    axis: (hours) => `${hours} h`,
    label: 'Sen',
    score: (n) => `ocena ${n}`,
    noNight: 'Brak danych o śnie',
  },

  records: {
    title: 'Rekordy',
    '5k': '5 km',
    '10k': '10 km',
    half: 'Półmaraton',
    marathon: 'Maraton',
    longest: 'Najdłuższy bieg',
    note: {
      '6w': 'Najlepsze biegi, ostatnie 6 tygodni',
      '3m': 'Najlepsze biegi, ostatnie 3 miesiące',
      '6m': 'Najlepsze biegi, ostatnie 6 miesięcy',
      year: 'Najlepsze biegi, ostatni rok',
    },
    isNew: (date) => `Nowy · ${date}`,
    noteAll: (since) => `Najlepsze biegi od ${since}`,
    scope: 'Rekordy z okresu',
    all: 'Wszystkie',
    none: 'Brak w tym okresie',
    heartRateLabel: 'Średnie tętno',
  },

  activities: {
    title: 'Aktywności',
    lead: 'Ile obciążenia dodał każdy trening.',
    filterLabel: 'Sport',
    filters: { all: 'Wszystkie', run: 'Biegi', ride: 'Rower', other: 'Inne' },
    sports: { run: 'Bieg', ride: 'Rower', other: 'Inne' },
    older: 'Pokaż starsze miesiące',
    empty: 'Nie ma jeszcze aktywności.',
    details: (name, date) => `${name}, ${date}`,
    distance: 'Dystans',
    elevation: 'Przewyższenie',
    movingTime: 'Czas ruchu',
    pace: 'Tempo',
    speed: 'Prędkość',
    heartRate: 'Średnie tętno',
    load: 'Obciążenie',
    loadFrom: (time, bpm) => `Obciążenie z czasu ${time} przy tętnie ${bpm}.`,
    loadNoHr: (time) => `Obciążenie z czasu ${time}; bez tętna, więc liczone jak spokojny wysiłek.`,
    formThatDay: 'Forma tego dnia',

    view: 'Widok',
    views: { list: 'Lista', weeks: 'Tygodnie' },
    olderWeeks: 'Pokaż starsze tygodnie',
    legendRun: 'Biegi',
    legendRide: 'Rower',
    legendOther: 'Inne: spacery, siłownia i reszta',
    legendHeight: 'Wyższy blok, większe obciążenie',
    weekLoad: (load, feel) =>
      feel ? `Obciążenie ${load}, ${{ easy: 'lekki tydzień', steady: 'równy tydzień', hard: 'ciężki tydzień' }[feel]}` : `Obciążenie ${load} do dziś`,
    formOnSunday: 'Forma w niedzielę',
    formToday: 'Forma dziś',
    sleep: (time) => `Sen ${time} na noc`,
    rest: 'Odpoczynek',
    restDay: 'Bez aktywności',
    dayLabel: (date, names, zone) =>
      `${date}, ${names.length ? names.join(', ') : 'odpoczynek'}${zone ? `, forma: ${zone}` : ''}`,
    formDot: (zone) => `Forma: ${zone}`,
    dayDetails: (date) => `Aktywności, ${date}`,
  },

  easyHr: {
    title: 'Tętno w spokojnym tempie',
    note: (from, to) =>
      `Biegi ${from}–${to} /km, ich liczba pod słupkiem. Niższe znaczy lepiej.`,
    aria: (first, from, last, to) => `Tętno w spokojnym tempie: ${first} bpm (${from}), ${last} bpm (${to}).`,
    empty: 'Brak spokojnych biegów z tętnem w tych miesiącach.',
    unit: (month) => `bpm · ${month}`,
    change: (change, month) => `${change > 0 ? '+' : change < 0 ? '−' : '±'}${Math.abs(change)} bpm vs ${month}`,
    runs: (n) => {
      const tens = n % 100;
      const few = n % 10 >= 2 && n % 10 <= 4 && (tens < 12 || tens > 14);
      return `${n} ${n === 1 ? 'bieg' : few ? 'biegi' : 'biegów'}`;
    },
    average: (bpm) => `Śr. ${bpm}`,
    heartRate: 'Tętno',
    pace: 'Tempo',
    barLabel: (month, bpm, runs) => `${month}: ${bpm}, ${runs}`,
  },

  ds: {
    title: 'Design system',
    lead: 'Tokeny i komponenty, z których zbudowana jest Forma, renderowane z kodu aplikacji na przykładowych danych. Przełącz motyw, żeby zobaczyć oba.',
    openApp: 'Otwórz Formę',
    principlesTitle: 'Zasady',
    principles: [
      'Jedno pytanie, spokojna odpowiedź: czy forma rośnie, jakie jest zmęczenie, czy dziś jest dzień na mocny bieg.',
      'Ciepłe, beżowoszare tło i jeden biały panel, który na nim leży. Karty w środku mają ramkę 1px i bez cienia.',
      'Duże cyfry o stałej szerokości, pod każdą jedna linijka, która mówi, co znaczy.',
      'Kolory treningu znaczą po jednej rzeczy: niebieski to kondycja, fioletowy zmęczenie, czerwony tętno, plus pięć kolorów stref formy. Nic innego ich nie używa.',
      'Umiar: lekkie grubości (400 i 500), dużo powietrza, delikatne ramki, pigułki, kolor jako miękki odcień.',
    ],
    colours: 'Kolory',
    coloursHint: 'Każda wartość pochodzi z tokens.css, pliku, który ładuje aplikacja. Jasny i ciemny obok siebie.',
    name: 'Token',
    ground: 'Tło',
    text: 'Tekst',
    accent: 'Akcent',
    accentHint: 'Głęboki granat, jedyny kolor marki: główne przyciski, linki, obwódka fokusu, chip nowego rekordu.',
    states: 'Stany',
    sidebar: 'Pasek boczny',
    sidebarHint: 'Ciepłe tło pod paskiem bocznym i panelem. Pasek boczny podmienia na te wartości tekst, tekst wyciszony, hover, zaznaczenie i akcent, więc jego wiersze nie potrzebują własnych reguł.',
    training: 'Trening',
    trainingHint: 'Kondycja, zmęczenie, obciążenie dzienne, tętno i sen. Tylko do tych miar; -ink do tekstu.',
    zones: 'Strefy formy',
    zonesHint: 'Każda strefa ma kolor słupka, -ink do tekstu i -tint na swój pas na wykresie.',
    type: 'Typografia',
    typeHint: 'Inter 400 i 500 do wszystkiego, 600 tylko do drobnych wersalików, jak COROS. Instrument Serif tylko w logotypie. Cyfry o stałej szerokości.',
    style: 'Styl',
    size: 'Rozmiar / linia',
    weight: 'Grubość',
    tracking: 'Światło',
    sample: 'Kondycja, zmęczenie i forma',
    typeUse: {
      wordmark: 'Forma w pasku bocznym',
      title: 'tytuły ekranów',
      kpi: 'wartości w kafelkach',
      number: 'czasy rekordów',
      heading: 'tytuły kart',
      subheading: 'podtytuły wykresów',
      lead: 'linijka stanu przy tytule',
      body: 'tekst, przyciski, etykiety',
      caption: 'notki, legenda, status w pasku',
      small: 'etykiety wykresów, chipy',
    },
    spacing: 'Odstępy',
    spacingHint: 'Siatka 4px. Kafelki i karty na ekranie Formy są 12px od siebie.',
    radii: 'Zaokrąglenia',
    radiiHint: 'Im większy element, tym bardziej zaokrąglony: wiersze, kontrolki, kafelki, karty.',
    shadows: 'Cienie',
    shadowsHint: 'Tylko dla tego, co unosi się nad resztą: panel, dymek, okna dialogowe.',
    components: 'Komponenty',
    sampleNote: 'Renderowane przez komponenty aplikacji, na przykładowych danych.',
    kpis: 'Kafelki KPI',
    kpisHint: 'Dzisiejsza wartość w kolorze swojej linii albo strefy, pod nią jedna linijka. Serce oznacza tętno.',
    segmented: 'Przełącznik segmentowy',
    segmentedHint: 'Radiogroup: jeden przystanek tabulatora, strzałki zmieniają wybór. sm dla języka, md w ustawieniach, box dla okresu. Przełącznik (aria-pressed) w tym samym pudełku włącza dodatki na karcie, np. pasek snu.',
    buttons: 'Przyciski',
    buttonsHint: '40px, zaokrąglenie 12; 44px dla głównego wezwania do działania. Główny granatowy, drugorzędny z ramką, tekstowy do cichych akcji.',
    primary: 'Zapisz',
    secondary: 'Anuluj',
    chips: 'Chipy',
    chipsHint: '12% koloru strefy z jej ciemniejszym tekstem. Nowe rekordy w granacie.',
    legends: 'Legendy',
    legendsHint: 'Klucz wykresu w jednym rzędzie; strefy po trzy linijki. Nazwa strefy otwiera przewodnik po strefach.',
    charts: 'Wykresy',
    chartsHint: 'Rysowane ręcznie w SVG, dopasowane do karty. Kondycja i forma mają wspólne pozycje x, więc dni leżą jeden pod drugim; pasek snu też. Każdy wykres ma zdanie w aria-label.',
    tooltip: 'Dymek dnia',
    tooltipHint: 'Idzie za kursorem albo strzałkami nad wykresami. Czytnik ekranu słyszy to samo jednym zdaniem.',
    dialog: 'Okno potwierdzenia',
    dialogHint: 'Natywne okno modalne. Fokus zaczyna na Anuluj; przy działaniach nieodwracalnych przycisk jest czerwony.',
    openDialog: 'Otwórz okno',
    settingsRow: 'Wiersz ustawień',
    settingsRowHint: 'Tytuł, podpowiedź pod nim, kontrolka po prawej. Błędy słowami pod podpowiedzią.',
    sidebarRows: 'Wiersze paska bocznego',
    sidebarRowsHint: 'Wiersze nawigacji 38px, zaokrąglenie 10; aktywny wypełniony i 500. Status źródła z kropką 7px.',
    activities: 'Aktywności',
    activitiesNote: 'Ekran Aktywności jest w budowie. Jego lista i wiersze trafią na tę stronę, gdy będzie gotowy.',
    content: 'Treść',
    contentRules: [
      'Prosto, krótko, wielka litera tylko na początku zdania.',
      'Pod każdą liczbą jedna linijka, co znaczy: „Średnie obciążenie, ostatnie 42 dni”.',
      'Polski w tym samym tonie, z prawdziwymi formami liczby mnogiej, przecinkiem dziesiętnym i miesiącami w miejscowniku („w październiku”).',
      'Bez przymiotników z rodzajem o biegaczu; nazwy stref to rzeczowniki.',
      'Bez motywacyjnych haseł, bez emoji.',
    ],
    a11y: 'Dostępność',
    a11yRules: [
      'Prawdziwe przyciski, linki, pola z etykietami i listy.',
      'Przełączniki okresu i języka to radiogroup ze strzałkami.',
      'Każdy wykres ma aria-label, który mówi, co pokazuje.',
      'Kolor nigdy nie jest jedynym znakiem: kolor strefy zawsze stoi obok jej nazwy.',
      'Kontrast tekstu co najmniej 4,5:1; widoczna obwódka fokusu w kolorze akcentu.',
      'Ruch jest drobny i znika, gdy system prosi o ograniczenie animacji.',
    ],
  },
};
