'use client';
import { useEffect, useState } from 'react';

const ROWS = [
  { key: 'fajr',    label: 'Fajr',    iqKey: 'fajrIqamah' },
  { key: 'sunrise', label: 'Sunrise', iqKey: null },
  { key: 'dhuhr',   label: 'Dhuhr',   iqKey: 'dhuhrIqamah' },
  { key: 'asr',     label: 'Asr',     iqKey: 'asrIqamah' },
  { key: 'maghrib', label: 'Maghrib', iqKey: 'maghribIqamah' },
  { key: 'isha',    label: 'Isha',    iqKey: 'ishaIqamah' },
  { key: 'jumuah',  label: "Jumu'ah (Fri)", iqKey: null },
];

export default function PrayersPage() {
  const [form, setForm]       = useState<Record<string, string>>({});
  const [ptId, setPtId]       = useState<string>('');
  const [source, setSource]   = useState('');
  const [slug, setSlug]       = useState('');
  const [saved, setSaved]     = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem('masjidSlug') || 'masjid-al-noor';
    const token = localStorage.getItem('token') || '';
    setSlug(s);
    fetch(`/api/display/${s}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        const p = data.prayerTimes;
        if (p?.id) {
          setPtId(p.id);
          setSource(p.source);
          const f: Record<string, string> = {};
          ROWS.forEach(row => {
            f[row.key] = (p[row.key] || '').substring(0, 5);
            if (row.iqKey) f[row.iqKey] = (p[row.iqKey] || '').substring(0, 5);
          });
          setForm(f);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const token = localStorage.getItem('token') || '';
    await fetch(`/api/display/${slug}/sync-prayers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    setSyncing(false);
    window.location.reload();
  };

  const handleSave = async () => {
    if (!ptId) return;
    const token = localStorage.getItem('token') || '';
    await fetch(`/api/admin/prayer-times/${ptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = (key: string) => (
    <input
      type="time"
      value={form[key] || ''}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm w-30"
    />
  );

  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Prayer times</h1>
          <p className="text-sm text-gray-500 mt-1">
            {source === 'ALADHAN' ? '✓ Auto-synced from Aladhan API' : 'Manually configured'}
          </p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
          {syncing ? 'Syncing...' : '↻ Sync from Aladhan'}
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium w-32">Prayer</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Azaan time</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium">Iqamah time</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(row => (
              <tr key={row.key} className="border-b border-gray-50 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-800">{row.label}</td>
                <td className="px-4 py-3">{inp(row.key)}</td>
                <td className="px-4 py-3">
                  {row.iqKey ? inp(row.iqKey) : <span className="text-gray-300 text-xs">No iqamah</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center gap-3">
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        <button onClick={handleSave}
          className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800">
          Save changes
        </button>
      </div>
    </div>
  );
}
