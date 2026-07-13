'use client';
import { useEffect, useState } from 'react';

const ROWS = [
  { key: 'fajr',    label: 'Fajr',          iqKey: 'fajrIqamah' },
  { key: 'sunrise', label: 'Sunrise',        iqKey: null },
  { key: 'dhuhr',   label: 'Dhuhr',          iqKey: 'dhuhrIqamah' },
  { key: 'asr',     label: 'Asr',            iqKey: 'asrIqamah' },
  { key: 'maghrib', label: 'Maghrib',         iqKey: 'maghribIqamah' },
  { key: 'isha',    label: 'Isha',            iqKey: 'ishaIqamah' },
  { key: 'jumuah',  label: "Jumu'ah (Fri)",   iqKey: null },
];

export default function PrayersPage() {
  const [form, setForm]       = useState<Record<string, string>>({});
  const [ptId, setPtId]       = useState('');
  const [source, setSource]   = useState('');
  const [slug, setSlug]       = useState('');
  const [saved, setSaved]     = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const s = localStorage.getItem('masjidSlug') || 'masjid-al-noor';
    const token = localStorage.getItem('token') || '';
    setSlug(s);
    fetch(`/api/display/${s}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const p = data.prayerTimes;
        if (p?.id) {
          setPtId(p.id); setSource(p.source);
          const f: Record<string, string> = {};
          ROWS.forEach(row => {
            f[row.key] = (p[row.key] || '').substring(0, 5);
            if (row.iqKey) f[row.iqKey] = (p[row.iqKey] || '').substring(0, 5);
          });
          setForm(f);
        }
      }).finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const token = localStorage.getItem('token') || '';
    await fetch(`/api/display/${slug}/sync-prayers`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    setSyncing(false);
    window.location.reload();
  };

  const handleSave = async () => {
    if (!ptId) return;
    const token = localStorage.getItem('token') || '';
    // Backend expects HH:MM:SS format for LocalTime
    const payload: Record<string, string> = {};
    Object.entries(form).forEach(([k, v]) => {
      payload[k] = v && v.length === 5 ? v + ':00' : v;
    });
    await fetch(`/api/admin/prayer-times/${ptId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="text-sm text-gray-400 pt-8 text-center">Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Prayer times</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {source === 'ALADHAN' ? '✓ Auto-synced from Aladhan' : 'Manually configured'}
          </p>
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-white active:bg-gray-50 disabled:opacity-50 min-h-[44px]">
          {syncing ? 'Syncing...' : '↻ Sync'}
        </button>
      </div>

      {/* Card layout — mobile friendly */}
      <div className="flex flex-col gap-2 mb-6">
        {ROWS.map(row => (
          <div key={row.key} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="text-xs font-medium text-gray-400 mb-2">{row.label}</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1">Azaan</div>
                <input type="time" value={form[row.key] || ''}
                  onChange={e => setForm(f => ({ ...f, [row.key]: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm min-h-[44px]" />
              </div>
              {row.iqKey ? (
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">Iqamah</div>
                  <input type="time" value={form[row.iqKey] || ''}
                    onChange={e => setForm(f => ({ ...f, [row.iqKey!]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm min-h-[44px]" />
                </div>
              ) : (
                <div className="flex-1">
                  <div className="text-xs text-gray-400 mb-1">Iqamah</div>
                  <div className="text-xs text-gray-300 py-3">—</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end items-center gap-3">
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
        <button onClick={handleSave}
          className="bg-gray-900 text-white text-sm px-6 py-3 rounded-xl hover:bg-gray-800 min-h-[44px] w-full">
          Save changes
        </button>
      </div>
    </div>
  );
}
