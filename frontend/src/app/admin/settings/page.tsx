'use client';
import { useEffect, useState } from 'react';

const CALC_METHODS = [
  [2,  'ISNA (North America)'],
  [1,  'Muslim World League'],
  [3,  'Egyptian General Authority'],
  [4,  "Umm Al-Qura (Mecca)"],
  [5,  'Karachi'],
  [11, 'Singapore MUIS'],
];

export default function SettingsPage() {
  const [form, setForm]         = useState<Record<string, any>>({});
  const [masjidId, setMasjidId] = useState('');
  const [saved, setSaved]       = useState(false);
  const [loading, setLoading]   = useState(true);

  const token = () => localStorage.getItem('token') || '';

  useEffect(() => {
    const id   = localStorage.getItem('masjidId') || '';
    const slug = localStorage.getItem('masjidSlug') || 'masjid-al-noor';
    setMasjidId(id);
    fetch(`/api/display/${slug}`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(data => { if (data.masjid) setForm(data.masjid); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await fetch(`/api/admin/masjid/${masjidId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(form),
    });
    localStorage.setItem('masjidSlug', form.slug);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (key: string, label: string, type = 'text', placeholder = '') => (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1.5">{label}</label>
      <input type={type} value={form[key] || ''} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[48px] focus:outline-none focus:ring-2 focus:ring-gray-300" />
    </div>
  );

  if (loading) return <div className="text-sm text-gray-400 pt-8 text-center">Loading...</div>;

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-400 mb-5">Masjid info and prayer calculation settings.</p>

      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-4 mb-6">
        {field('name', 'Masjid name')}

        <div className="grid grid-cols-2 gap-3">
          {field('city', 'City')}
          {field('country', 'Country')}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field('latitude',  'Latitude',  'number', '45.9636')}
          {field('longitude', 'Longitude', 'number', '-66.6431')}
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Calculation method</label>
          <select value={form.calcMethod || 2}
            onChange={e => setForm(f => ({ ...f, calcMethod: Number(e.target.value) }))}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[48px]">
            {CALC_METHODS.map(([val, lbl]) => (
              <option key={val} value={val}>{lbl}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Timezone</label>
          <input value={form.timezone || ''} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
            placeholder="America/Moncton"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[48px]" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Display URL slug</label>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <span className="px-3 py-3 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">/display/</span>
            <input value={form.slug || ''} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              className="flex-1 px-3 py-3 text-sm min-h-[48px] focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1.5">Accent colour</label>
          <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 min-h-[48px]">
            <input type="color" value={form.accentColor || '#c9a84c'}
              onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
              className="w-10 h-10 rounded border-0 cursor-pointer" />
            <span className="text-sm text-gray-600 font-mono">{form.accentColor || '#c9a84c'}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        <button onClick={handleSave}
          className="bg-gray-900 text-white text-sm px-6 py-3 rounded-xl w-full min-h-[48px]">
          Save settings
        </button>
      </div>
    </div>
  );
}
