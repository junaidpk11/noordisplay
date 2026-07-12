'use client';
import { useEffect, useState } from 'react';

interface Ann { id: string; message: string; active: boolean; startsAt: string | null; endsAt: string | null; }

export default function AnnouncementsPage() {
  const [items, setItems]       = useState<Ann[]>([]);
  const [masjidId, setMasjidId] = useState('');
  const [msg, setMsg]           = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt]     = useState('');
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showForm, setShowForm] = useState(false);

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
    setSaving(false); setSaved(true); setShowForm(false);
    setTimeout(() => setSaved(false), 2000);
    load(masjidId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
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
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Announcements</h1>
          <p className="text-xs text-gray-400 mt-0.5">Scroll across the bottom ticker</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gray-900 text-white text-sm px-4 py-2.5 rounded-xl min-h-[44px]">
          + Add
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-900 mb-3">New announcement</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Message</label>
              <textarea value={msg} onChange={e => setMsg(e.target.value)}
                placeholder="e.g. Free Quran classes every Saturday at 10 AM"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm resize-none h-20 focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Start date</label>
                <input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-h-[44px]" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">End date</label>
                <input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm min-h-[44px]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 rounded-xl py-3 text-sm text-gray-600 min-h-[44px]">
                Cancel
              </button>
              <button onClick={handleAdd} disabled={saving || !msg.trim()}
                className="flex-1 bg-gray-900 text-white rounded-xl py-3 text-sm disabled:opacity-50 min-h-[44px]">
                {saving ? 'Adding...' : 'Add'}
              </button>
            </div>
            {saved && <span className="text-sm text-green-600 text-center">✓ Added</span>}
          </div>
        </div>
      )}

      {/* List */}
      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-12 text-center">
          <div className="text-3xl mb-2">📢</div>
          <div className="text-sm text-gray-400">No announcements yet</div>
          <button onClick={() => setShowForm(true)}
            className="mt-3 text-sm text-blue-600">Add one</button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(ann => (
            <div key={ann.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-800 mb-2">{ann.message}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ann.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ann.active ? 'Active' : 'Inactive'}
                  </span>
                  {ann.endsAt && <span className="text-xs text-gray-400">Ends {ann.endsAt}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(ann)}
                    className="text-xs text-gray-600 border border-gray-200 rounded-lg px-3 py-2 min-h-[36px]">
                    {ann.active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(ann.id)}
                    className="text-xs text-red-500 border border-red-100 rounded-lg px-3 py-2 min-h-[36px]">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
