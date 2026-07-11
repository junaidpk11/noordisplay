export interface Masjid {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  calcMethod: number;
  accentColor: string;
  language: string;
  features: MasjidFeatures;
}

export interface MasjidFeatures {
  id: string;
  showQuotes: boolean;
  showIqamah: boolean;
  showCountdown: boolean;
  showHijri: boolean;
  showTicker: boolean;
  showJumuahBanner: boolean;
  showDonationWidget: boolean;
  azaanAudio: boolean;
  iqamahScreen: boolean;
  showWeather: boolean;
  quoteIntervalSecs: number;
  quoteSource: 'QURAN' | 'HADITH' | 'BOTH';
  timeFormat: '12h' | '24h';
  ramadanMode: boolean;
  suhoorTime: string | null;
  tarawihTime: string | null;
  tarawihRakats: number;
  quranJuzCurrent: number;
}

export interface PrayerTimes {
  id: string;
  prayerDate: string;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fajrIqamah: string;
  dhuhrIqamah: string;
  asrIqamah: string;
  maghribIqamah: string;
  ishaIqamah: string;
  jumuah: string;
  source: 'ALADHAN' | 'MANUAL';
}

export interface Announcement {
  id: string;
  message: string;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
}

export interface DisplayData {
  masjid: Masjid;
  prayerTimes: PrayerTimes;
  announcements: Announcement[];
  features: MasjidFeatures;
}

export type DisplayPhase = 'NORMAL' | 'WARN' | 'IQAMAH' | 'IN_PRAYER';
