'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminOverview() {
  const router = useRouter();
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    const slug = localStorage.getItem('masjidSlug') || 'masjid-al-noor';
    fetch(`/api/display/${slug}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { router.push('/auth/login'); });
  }, []);

  if (loading) return <div className="text-sm text-gray-400">Loading...</div>;

  const slug = data?.masjid?.slug ?? '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-medium text-gray-900 mb-1">Overview</h1>
      <p className="text-sm text-gray-500 mb-6">Your display is live.</p>

      <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-4 py-3 mb-6 text-sm">
        <span className="text-gray-500">TV display URL:</span>
        <span className="font-mono text-gray-900 flex-1">{origin}/display/{slug}</span>
        <a href={`/display/${slug}`} target="_blank"
           className="text-blue-600 hover:underline text-xs whitespace-nowrap">
          Open ↗
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Masjid',               value: data?.masjid?.name ?? '—' },
          { label: 'City',                 value: data?.masjid?.city ?? '—' },
          { label: 'Active announcements', value: data?.announcements?.filter((a: any) => a.active).length ?? 0 },
        ].map(s => (
          <div key={s.label} className="bg-gray-100 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className="text-base font-medium text-gray-900">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <Link href="/admin/prayers"       className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Manage prayer times</Link>
        <Link href="/admin/announcements" className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Add announcement</Link>
        <Link href="/admin/features"      className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Toggle features</Link>
        <Link href="/admin/settings"      className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Masjid settings</Link>
        <Link href="/admin/khutbah"       className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Live khutbah</Link>
      </div>
    </div>
  );
}
