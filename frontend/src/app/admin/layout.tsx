'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin',               label: 'Overview',      icon: '⊞' },
  { href: '/admin/prayers',       label: 'Prayer times',  icon: '🕐' },
  { href: '/admin/announcements', label: 'Announcements', icon: '📢' },
  { href: '/admin/scheduler',     label: 'Scheduler',     icon: '🗓' },
  { href: '/admin/features',      label: 'Features',      icon: '⚙' },
  { href: '/admin/settings',      label: 'Settings',      icon: '🏛' },
  { href: '/admin/khutbah',       label: 'Live khutbah',  icon: '🎙' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/auth/login'); } else { setAuthed(true); }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('masjidId');
    localStorage.removeItem('masjidSlug');
    router.push('/auth/login');
  };

  if (!authed) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-400">Loading...</div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-48 bg-white border-r border-gray-100 flex flex-col py-4 shrink-0">
        <div className="px-4 pb-4 border-b border-gray-100 mb-2">
          <div className="text-sm font-medium text-gray-900">NoorDisplay</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin panel</div>
        </div>
        <nav className="flex-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors
                ${pathname === n.href
                  ? 'text-gray-900 font-medium bg-gray-50 border-l-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout} className="mx-4 text-xs text-gray-400 hover:text-gray-700 text-left pb-2">
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
