'use client';
import { useEffect, useState } from 'react';

interface Ann { id: string; message: string; active: boolean; startsAt: string | null; endsAt: string | null; }

export default function AnnouncementsPage() {
  const [items, setItems]     = useState<Ann[]>([]);
  const [masjidId, setMasjidId] = useState('');
  const [msg, setMsg]         = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const token = () => localStorage.getItem('token') || '';

  const load = (id: string) => {
    fetch(`/api/admin/masjid/${id}/announcements`, {
      headers: { Authorization: `Bearer ${token()}` }
    }).then(r => r.json()).then(setItems);
  };

  useEffect(() => {
    const id = localStorage.getItem('masjidId') || '';
    setMasjidId(id);
    if (id) load(id);
  }, []);

  const handleAdd = async () => {
    if (!msg.trim()) return;
    setSaving(true);
    await fetch(`/api/admin/masjid/${masjidId}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ message: msg, active: true, startsAt: startsAt || null, endsAt: endsAt || null, sortOrder: items.length }),
    });
    setMsg(''); setStartsAt(''); setEndsAt('');
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    load(masjidId);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token()}` }
    });
    load(masjidId);
  };

  const handleToggle = async (ann: Ann) => {
    await fetch(`/api/admin/announcements/${ann.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ ...ann, active: !ann.active }),
    });
    load(masjidId);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-medium text-gray-900 mb-1">Announcements</h1>
      <p className="text-sm text-gray-500 mb-6">These scroll across the bottom ticker of your display.</p>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-6">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No announcements yet</div>
        ) : items.map(ann => (
          <div key={ann.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1">
              <p className="text-sm text-gray-800">{ann.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ann.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {ann.active ? 'Active' : 'Inactive'}
                </span>
                {ann.endsAt && <span className="text-xs text-gray-400">Ends {ann.endsAt}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => handleToggle(ann)}
                className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-2 py-1">
                {ann.active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => handleDelete(ann.id)}
                className="text-xs text-red-400 hover:text-red-600 border border-red-100 rounded px-2 py-1">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-900 mb-4">Add announcement</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Message</label>
            <textarea
              value={msg}
              onChange={e => setMsg(e.target.value)}
              placeholder="e.g. Free Quran classes every Saturday at 10 AM"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Start date (optional)</label>
              <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">End date (optional)</label>
              <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex justify-end items-center gap-3">
            {saved && <span className="text-sm text-green-600">✓ Added</span>}
            <button onClick={handleAdd} disabled={saving || !msg.trim()}
              className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Adding...' : 'Add announcement'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
