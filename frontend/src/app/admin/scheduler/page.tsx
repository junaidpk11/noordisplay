'use client';
import { useEffect, useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TYPES = [
  { value: 'ANNOUNCEMENT', label: 'Announcement' },
  { value: 'POSTER',       label: 'Image / poster' },
  { value: 'QURAN',        label: 'Quran quote' },
  { value: 'HADITH',       label: 'Hadith' },
  { value: 'ETIQUETTE',    label: 'Etiquettes screen' },
  { value: 'CUSTOM',       label: 'Custom full-screen' },
];
const TYPE_COLORS: Record<string, string> = {
  ANNOUNCEMENT: '#3B82F6', POSTER: '#8B5CF6', QURAN: '#059669',
  HADITH: '#D97706', ETIQUETTE: '#DC2626', CUSTOM: '#0891B2',
};

function fmt12(t: string) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function dayStr(repeatDays: string) {
  if (repeatDays === '0123456') return 'Every day';
  return repeatDays.split('').map(d => DAYS[parseInt(d)]).join(', ');
}

interface Slot {
  id?: string; name: string; slotType: string;
  startTime: string; endTime: string; repeatDays: string;
  dateFrom: string; dateUntil: string; message: string; active: boolean;
}

const empty: Slot = {
  name: '', slotType: 'ANNOUNCEMENT', startTime: '08:00', endTime: '10:00',
  repeatDays: '0123456', dateFrom: '', dateUntil: '', message: '', active: true,
};

export default function SchedulerPage() {
  const [slots, setSlots]       = useState<Slot[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState<Slot>({ ...empty });
  const [selDays, setSelDays]   = useState<number[]>([0,1,2,3,4,5,6]);
  const [masjidId, setMasjidId] = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  const token = () => localStorage.getItem('token') || '';

  const load = (id: string) =>
    fetch(`/api/admin/scheduler/masjid/${id}`, {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()).then(setSlots);

  useEffect(() => {
    const id = localStorage.getItem('masjidId') || '';
    setMasjidId(id); if (id) load(id);
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    await fetch(`/api/admin/scheduler/masjid/${masjidId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...form, repeatDays: selDays.join('') }),
    });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setShowForm(false); setForm({ ...empty }); setSelDays([0,1,2,3,4,5,6]);
    load(masjidId);
  };

  const handleToggle = async (slot: Slot) => {
    await fetch(`/api/admin/scheduler/${slot.id}/toggle`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token()}` }
    });
    load(masjidId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slot?')) return;
    await fetch(`/api/admin/scheduler/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
    });
    load(masjidId);
  };

  const toggleDay = (d: number) =>
    setSelDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  const statusBadge = (s: Slot) => {
    const today = new Date().toISOString().split('T')[0];
    if (!s.active) return { label: 'Inactive', cls: 'bg-gray-100 text-gray-500' };
    if (s.dateFrom && s.dateFrom > today) return { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700' };
    if (s.dateUntil && s.dateUntil < today) return { label: 'Expired', cls: 'bg-gray-100 text-gray-400' };
    return { label: 'Active', cls: 'bg-green-50 text-green-700' };
  };

  const timelineSegs = () => {
    const total = 24 * 60;
    const map = new Array(total).fill('');
    slots.filter(s => s.active).forEach(s => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      for (let i = sh*60+sm; i < eh*60+em && i < total; i++) map[i] = s.slotType;
    });
    const segs: { type: string; len: number }[] = [];
    let cur = map[0], len = 1;
    for (let i = 1; i <= total; i++) {
      if (map[i] !== cur || i === total) { segs.push({ type: cur, len }); cur = map[i]; len = 1; }
      else len++;
    }
    return segs;
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Scheduler</h1>
          <p className="text-xs text-gray-400 mt-0.5">Control what shows on your display and when</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl min-h-[44px]">
          + New slot
        </button>
      </div>

      {/* Timeline */}
      <div className="mb-5">
        <div className="h-6 rounded-lg overflow-hidden flex border border-gray-100 mb-1">
          {timelineSegs().map((seg, i) => (
            <div key={i} style={{ flex: seg.len, background: seg.type ? TYPE_COLORS[seg.type] : '#f3f4f6', minWidth: 0 }} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-4">New slot</div>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Slot name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Jumu'ah reminder"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[48px]" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Content type</label>
              <select value={form.slotType} onChange={e => setForm(f => ({ ...f, slotType: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[48px]">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Start time</label>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">End time</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm min-h-[48px]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">From (optional)</label>
                <input type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm min-h-[48px]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Until (optional)</label>
                <input type="date" value={form.dateUntil} onChange={e => setForm(f => ({ ...f, dateUntil: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm min-h-[48px]" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">Repeat on</label>
              <div className="flex gap-1.5">
                {DAYS.map((day, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className={`flex-1 py-2.5 text-xs rounded-xl border min-h-[44px] transition-colors
                      ${selDays.includes(i) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200'}`}>
                    {day.slice(0,2)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Message (optional)</label>
              <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="e.g. Jumu'ah at 1:15 PM today"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[48px]" />
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => { setShowForm(false); setForm({ ...empty }); setSelDays([0,1,2,3,4,5,6]); }}
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 min-h-[48px]">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving || !form.name.trim()}
                className="flex-1 bg-gray-900 text-white rounded-xl py-3 text-sm disabled:opacity-50 min-h-[48px]">
                {saving ? 'Saving...' : 'Add slot'}
              </button>
            </div>
            {saved && <span className="text-sm text-green-600 text-center">✓ Added</span>}
          </div>
        </div>
      )}

      {/* Slot list */}
      {slots.length === 0 ? (
        <div className="border border-dashed border-gray-200 rounded-xl py-12 text-center">
          <div className="text-3xl mb-2">🗓</div>
          <div className="text-sm text-gray-400 mb-3">No slots yet</div>
          <button onClick={() => setShowForm(true)} className="text-sm text-blue-600">Add your first slot</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {slots.map(slot => {
            const badge = statusBadge(slot);
            return (
              <div key={slot.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div style={{ width: 4, minHeight: 44, borderRadius: 2, background: TYPE_COLORS[slot.slotType] || '#888', flexShrink: 0, marginTop: 2 }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{slot.name}</div>
                      <button onClick={() => handleToggle(slot)}
                        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${slot.active ? 'bg-gray-900' : 'bg-gray-200'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${slot.active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                      <span className="text-xs text-gray-400">{fmt12(slot.startTime)} – {fmt12(slot.endTime)}</span>
                      <span className="text-xs text-gray-400">{dayStr(slot.repeatDays)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-2">
                  <button onClick={() => handleDelete(slot.id!)}
                    className="text-xs text-red-400 border border-red-100 rounded-lg px-3 py-1.5 min-h-[36px]">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
