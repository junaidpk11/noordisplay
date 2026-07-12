'use client';
import { useEffect, useState } from 'react';

const TOGGLES = [
  { key: 'showQuotes',         label: 'Rotating quotes',          desc: 'Quran & Hadith quotes' },
  { key: 'showIqamah',         label: 'Iqamah times',             desc: 'Show iqamah below each prayer' },
  { key: 'showCountdown',      label: 'Countdown timer',          desc: 'Live timer to next prayer' },
  { key: 'showHijri',          label: 'Hijri date',               desc: 'Islamic calendar date' },
  { key: 'showTicker',         label: 'Announcement ticker',      desc: 'Scrolling announcements' },
  { key: 'showJumuahBanner',   label: "Jumu'ah banner",           desc: 'Friday reminder banner' },
  { key: 'iqamahScreen',       label: 'Iqamah countdown screen',  desc: 'Full-screen 5 min before iqamah' },
  { key: 'showDonationWidget', label: 'Donation widget',          desc: 'Niyyah fundraising widget' },
  { key: 'azaanAudio',         label: 'Azaan audio',              desc: 'Play azaan at prayer time' },
  { key: 'showWeather',        label: 'Weather widget',           desc: 'Local weather in header' },
];

const SELECTS = [
  { key: 'quoteSource',       label: 'Quote source',    options: [['BOTH','Quran + Hadith'],['QURAN','Quran only'],['HADITH','Hadith only']] },
  { key: 'timeFormat',        label: 'Time format',     options: [['12h','12-hour (1:00 PM)'],['24h','24-hour (13:00)']] },
  { key: 'quoteIntervalSecs', label: 'Quote interval',  options: [['10','10 seconds'],['12','12 seconds'],['20','20 seconds'],['30','30 seconds']] },
];

export default function FeaturesPage() {
  const [form, setForm]         = useState<Record<string, any>>({});
  const [masjidId, setMasjidId] = useState('');
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);

  const token = () => localStorage.getItem('token') || '';

  useEffect(() => {
    const slug = localStorage.getItem('masjidSlug') || 'masjid-al-noor';
    const id   = localStorage.getItem('masjidId') || '';
    setMasjidId(id);
    fetch(`/api/display/${slug}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(data => { if (data.features) setForm(data.features); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await fetch(`/api/admin/masjid/${masjidId}/features`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggle = (key: string) => setForm(f => ({ ...f, [key]: !f[key] }));

  if (loading) return <div className="text-sm text-gray-400 pt-8 text-center">Loading...</div>;

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Features</h1>
      <p className="text-sm text-gray-400 mb-5">Toggle what appears on the TV display.</p>

      {/* Toggles */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-4">
        {TOGGLES.map((t, i) => (
          <div key={t.key}
            className={`flex items-center justify-between px-4 py-3.5 min-h-[60px] ${i < TOGGLES.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="flex-1 pr-4">
              <div className="text-sm font-medium text-gray-800">{t.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{t.desc}</div>
            </div>
            <button onClick={() => toggle(t.key)}
              className={`relative w-12 h-7 rounded-full transition-colors shrink-0 ${form[t.key] ? 'bg-gray-900' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${form[t.key] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Selects */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        {SELECTS.map((s, i) => (
          <div key={s.key}
            className={`flex items-center justify-between px-4 py-3.5 min-h-[60px] ${i < SELECTS.length - 1 ? 'border-b border-gray-50' : ''}`}>
            <div className="text-sm font-medium text-gray-800">{s.label}</div>
            <select value={form[s.key] || ''}
              onChange={e => setForm(f => ({ ...f, [s.key]: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm min-h-[44px]">
              {s.options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        <button onClick={handleSave}
          className="bg-gray-900 text-white text-sm px-6 py-3 rounded-xl w-full min-h-[48px]">
          Save features
        </button>
      </div>
    </div>
  );
}
