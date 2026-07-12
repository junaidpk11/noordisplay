'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminOverview() {
  const router = useRouter();
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/auth/login'); return; }
    const slug = localStorage.getItem('masjidSlug') || 'masjid-al-noor';
    fetch(`/api/display/${slug}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => router.push('/auth/login'));
  }, []);

  if (loading) return <div className="text-sm text-gray-400 pt-8 text-center">Loading...</div>;

  const slug   = data?.masjid?.slug ?? '';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const displayUrl = `${origin}/display/${slug}`;

  const QUICK_LINKS = [
    { href: '/admin/prayers',       icon: '🕐', label: 'Prayer times' },
    { href: '/admin/announcements', icon: '📢', label: 'Announcements' },
    { href: '/admin/scheduler',     icon: '🗓', label: 'Scheduler' },
    { href: '/admin/khutbah',       icon: '🎙', label: 'Live khutbah' },
    { href: '/admin/features',      icon: '⚙',  label: 'Features' },
    { href: '/admin/settings',      icon: '🏛',  label: 'Settings' },
  ];

  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">{data?.masjid?.name}</h1>
      <p className="text-sm text-gray-500 mb-5">{data?.masjid?.city}, {data?.masjid?.country}</p>

      {/* Display URL */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
        <div className="text-xs text-gray-500 mb-1 font-medium">TV Display URL</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 flex-1 break-all font-mono">{displayUrl}</span>
          <a href={`/display/${slug}`} target="_blank"
            className="shrink-0 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg">
            Open ↗
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Announcements</div>
          <div className="text-2xl font-semibold text-gray-900">
            {data?.announcements?.filter((a: any) => a.active).length ?? 0}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">active</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-1">Next prayer</div>
          <div className="text-2xl font-semibold text-gray-900">
            {data?.prayerTimes?.dhuhr?.substring(0,5) ?? '—'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">Dhuhr</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_LINKS.map(l => (
          <Link key={l.href} href={l.href}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 active:bg-gray-50">
            <span className="text-2xl">{l.icon}</span>
            <span className="text-sm font-medium text-gray-700">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
