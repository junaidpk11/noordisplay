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
  id?: string;
  name: string;
  slotType: string;
  startTime: string;
  endTime: string;
  repeatDays: string;
  dateFrom: string;
  dateUntil: string;
  message: string;
  active: boolean;
}

const empty: Slot = {
  name: '', slotType: 'ANNOUNCEMENT', startTime: '08:00', endTime: '10:00',
  repeatDays: '0123456', dateFrom: '', dateUntil: '', message: '', active: true,
};

export default function SchedulerPage() {
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<Slot>({ ...empty });
  const [selDays, setSelDays]     = useState<number[]>([0,1,2,3,4,5,6]);
  const [masjidId, setMasjidId]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  const token = () => localStorage.getItem('token') || '';

  const load = (id: string) =>
    fetch(`/api/admin/scheduler/masjid/${id}`, {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()).then(setSlots);

  useEffect(() => {
    const id = localStorage.getItem('masjidId') || '';
    setMasjidId(id);
    if (id) load(id);
  }, []);

  const handleAdd = async () => {
    setSaving(true);
    const payload = { ...form, repeatDays: selDays.join('') };
    await fetch(`/api/admin/scheduler/masjid/${masjidId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setShowForm(false);
    setForm({ ...empty });
    setSelDays([0,1,2,3,4,5,6]);
    load(masjidId);
  };

  const handleToggle = async (slot: Slot) => {
    await fetch(`/api/admin/scheduler/${slot.id}/toggle`, {
      method: 'PATCH', headers: { Authorization: `Bearer ${token()}` }
    });
    load(masjidId);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/scheduler/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
    });
    load(masjidId);
  };

  const toggleDay = (d: number) =>
    setSelDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  // Build 24h timeline segments
  const timelineSegs = () => {
    const total = 24 * 60;
    const map = new Array(total).fill('');
    slots.filter(s => s.active).forEach(s => {
      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);
      for (let i = sh * 60 + sm; i < eh * 60 + em && i < total; i++) map[i] = s.slotType;
    });
    const segs: { type: string; len: number }[] = [];
    let cur = map[0], len = 1;
    for (let i = 1; i <= total; i++) {
      if (map[i] !== cur || i === total) { segs.push({ type: cur, len }); cur = map[i]; len = 1; }
      else len++;
    }
    return segs;
  };

  const statusBadge = (s: Slot) => {
    const today = new Date().toISOString().split('T')[0];
    if (!s.active) return { label: 'Inactive', cls: 'bg-gray-100 text-gray-500' };
    if (s.dateFrom && s.dateFrom > today) return { label: 'Scheduled', cls: 'bg-blue-50 text-blue-700' };
    if (s.dateUntil && s.dateUntil < today) return { label: 'Expired', cls: 'bg-gray-100 text-gray-400' };
    return { label: 'Active', cls: 'bg-green-50 text-green-700' };
  };

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Content scheduler</h1>
          <p className="text-sm text-gray-500 mt-1">Control what appears on your display and when.</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 flex items-center gap-2">
          + New slot
        </button>
      </div>

      {/* Daily timeline */}
      <div className="mb-6">
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Today's schedule</div>
        <div className="h-7 rounded-lg overflow-hidden flex border border-gray-100">
          {timelineSegs().map((seg, i) => (
            <div key={i} style={{
              flex: seg.len,
              background: seg.type ? TYPE_COLORS[seg.type] : '#f3f4f6',
              minWidth: 0,
            }} title={seg.type} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>12 AM</span>
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-gray-500">
              <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </div>
          ))}
        </div>
      </div>

      {/* Slot list */}
      <div className="flex flex-col gap-3 mb-6">
        {slots.length === 0 && (
          <div className="text-sm text-gray-400 py-8 text-center border border-dashed border-gray-200 rounded-xl">
            No scheduled slots yet. Click New slot to add one.
          </div>
        )}
        {slots.map(slot => {
          const badge = statusBadge(slot);
          return (
            <div key={slot.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
              <div style={{ width: 4, height: 40, borderRadius: 2, background: TYPE_COLORS[slot.slotType] || '#888', flexShrink: 0 }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">{slot.name}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {TYPES.find(t => t.value === slot.slotType)?.label}
                  </span>
                  <span className="text-xs text-gray-500">
                    {fmt12(slot.startTime)} – {fmt12(slot.endTime)}
                  </span>
                  <span className="text-xs text-gray-400">{dayStr(slot.repeatDays)}</span>
                  {slot.dateUntil && <span className="text-xs text-gray-400">until {slot.dateUntil}</span>}
                </div>
              </div>
              <button onClick={() => handleToggle(slot)}
                className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${slot.active ? 'bg-gray-900' : 'bg-gray-200'}`}
                aria-label={`Toggle ${slot.name}`}>
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${slot.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <button onClick={() => handleDelete(slot.id!)}
                className="text-gray-300 hover:text-red-400 text-xs px-2">
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-medium text-gray-900 mb-4">New scheduled slot</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Slot name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Jumu'ah reminder, Ramadan poster"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Content type</label>
              <select value={form.slotType} onChange={e => setForm(f => ({ ...f, slotType: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Start time</label>
              <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">End time</label>
              <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Date from (optional)</label>
              <input type="date" value={form.dateFrom} onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Date until (optional)</label>
              <input type="date" value={form.dateUntil} onChange={e => setForm(f => ({ ...f, dateUntil: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-2">Repeat on days</label>
              <div className="flex gap-2">
                {DAYS.map((day, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${selDays.includes(i) ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-600 block mb-1">Message (optional)</label>
              <input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                placeholder="e.g. Jumu'ah today at 1:15 PM — please arrive early"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4 bg-white border border-gray-100 rounded-lg px-4 py-3 text-xs text-gray-500">
            Preview: &ldquo;{form.name || 'This slot'}&rdquo; will show{' '}
            {selDays.length === 7 ? 'every day' : selDays.map(d => DAYS[d]).join(', ')}{' '}
            from {fmt12(form.startTime)} to {fmt12(form.endTime)}
          </div>

          <div className="flex justify-end items-center gap-3 mt-4">
            {saved && <span className="text-sm text-green-600">✓ Added</span>}
            <button onClick={() => { setShowForm(false); setForm({ ...empty }); setSelDays([0,1,2,3,4,5,6]); }}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving || !form.name.trim()}
              className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add slot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
