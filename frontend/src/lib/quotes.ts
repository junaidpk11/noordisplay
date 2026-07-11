// Background images served from /public/images/quotes/ — local files,
// no external CDN dependency. Mix of Islamic architecture and nature.
// Images 7 (human silhouette) and 10 (people in background) excluded.

const IMG = {
  mosqueAbuDhabi:  '/images/quotes/mosque-abu-dhabi.jpg',   // Sheikh Zayed — white domes, minaret
  mosqueMisty:     '/images/quotes/mosque-misty.jpg',       // Sheikh Zayed — misty dawn, two minarets
  islamicTilework: '/images/quotes/islamic-tilework.jpg',   // Persian tilework dome with calligraphy
  goldenSky:       '/images/quotes/golden-sky-birds.jpg',   // Golden clouds, birds in flight, trees
  mountainPines:   '/images/quotes/mountain-pines.jpg',     // Snow-capped mountains, pine forest
  grassBokeh:      '/images/quotes/grass-bokeh.jpg',        // Soft grass close-up, gentle bokeh
  mountainValley:  '/images/quotes/mountain-valley.jpg',    // Alpine valley, fallen log, peaks
  autumnLeaves:    '/images/quotes/autumn-leaves.jpg',      // Autumn leaves on ground, forest
};

export const quotes = [
  {
    arabic: "﴿وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا﴾",
    en: "And whoever fears Allah — He will make for him a way out.",
    src: "Quran 65:2",
    type: "QURAN",
    bg: IMG.mosqueAbuDhabi,
  },
  {
    arabic: "﴿إِنَّ مَعَ الْعُسْرِ يُسْرًا﴾",
    en: "Indeed, with hardship will be ease.",
    src: "Quran 94:6",
    type: "QURAN",
    bg: IMG.mountainValley,
  },
  {
    arabic: "﴿وَاللَّهُ مَعَ الصَّابِرِينَ﴾",
    en: "And Allah is with the patient.",
    src: "Quran 2:249",
    type: "QURAN",
    bg: IMG.mountainPines,
  },
  {
    arabic: "﴿فَاذْكُرُونِي أَذْكُرْكُمْ﴾",
    en: "Remember Me, and I will remember you.",
    src: "Quran 2:152",
    type: "QURAN",
    bg: IMG.islamicTilework,
  },
  {
    arabic: "﴿وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ﴾",
    en: "Do not despair of relief from Allah.",
    src: "Quran 12:87",
    type: "QURAN",
    bg: IMG.goldenSky,
  },
  {
    arabic: "﴿رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً﴾",
    en: "Our Lord, give us good in this world and in the Hereafter.",
    src: "Quran 2:201",
    type: "QURAN",
    bg: IMG.grassBokeh,
  },
  {
    arabic: "﴿وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ﴾",
    en: "Establish prayer and give zakah.",
    src: "Quran 2:43",
    type: "QURAN",
    bg: IMG.mosqueMisty,
  },
  {
    arabic: "﴿إِنَّ اللَّهَ مَعَ الَّذِينَ اتَّقَوْا﴾",
    en: "Indeed, Allah is with those who fear Him.",
    src: "Quran 16:128",
    type: "QURAN",
    bg: IMG.autumnLeaves,
  },
  {
    arabic: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",
    en: "The best of you are those who learn the Quran and teach it.",
    src: "Hadith — Bukhari",
    type: "HADITH",
    bg: IMG.islamicTilework,
  },
  {
    arabic: "الدُّعَاءُ مُخُّ الْعِبَادَةِ",
    en: "Supplication is the essence of worship.",
    src: "Hadith — Tirmidhi",
    type: "HADITH",
    bg: IMG.mosqueAbuDhabi,
  },
  {
    arabic: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ",
    en: "Fear Allah wherever you are.",
    src: "Hadith — Tirmidhi",
    type: "HADITH",
    bg: IMG.mountainPines,
  },
  {
    arabic: "خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ",
    en: "The best of people are those most beneficial to others.",
    src: "Hadith — Al-Albani",
    type: "HADITH",
    bg: IMG.goldenSky,
  },
  {
    arabic: "أَحَبُّ الأَعْمَالِ إِلَى اللَّهِ أَدْوَمُهَا وَإِن قَلَّ",
    en: "The most beloved deeds to Allah are those done consistently, even if small.",
    src: "Hadith — Bukhari",
    type: "HADITH",
    bg: IMG.grassBokeh,
  },
  {
    arabic: "مَنْ صَلَّى عَلَيَّ صَلَاةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا",
    en: "Whoever sends one blessing upon me, Allah sends ten blessings upon him.",
    src: "Hadith — Muslim",
    type: "HADITH",
    bg: IMG.mosqueMisty,
  },
  {
    arabic: "الطُّهُورُ شَطْرُ الْإِيمَانِ",
    en: "Cleanliness is half of faith.",
    src: "Hadith — Muslim",
    type: "HADITH",
    bg: IMG.autumnLeaves,
  },
];
