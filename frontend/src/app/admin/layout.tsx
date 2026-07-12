'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV = [
  { href: '/admin',               label: 'Overview',     icon: '⊞' },
  { href: '/admin/prayers',       label: 'Prayers',      icon: '🕐' },
  { href: '/admin/announcements', label: 'Announce',     icon: '📢' },
  { href: '/admin/scheduler',     label: 'Schedule',     icon: '🗓' },
  { href: '/admin/khutbah',       label: 'Khutbah',      icon: '🎙' },
  { href: '/admin/features',      label: 'Features',     icon: '⚙' },
  { href: '/admin/settings',      label: 'Settings',     icon: '🏛' },
];

// Bottom tab bar shows 5 most used items on mobile
const BOTTOM_NAV = [
  { href: '/admin',               label: 'Home',     icon: '⊞' },
  { href: '/admin/prayers',       label: 'Prayers',  icon: '🕐' },
  { href: '/admin/announcements', label: 'Announce', icon: '📢' },
  { href: '/admin/khutbah',       label: 'Khutbah',  icon: '🎙' },
  { href: '/admin/settings',      label: 'More',     icon: '⋯' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [authed, setAuthed]     = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-400">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── MOBILE HEADER ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-14">
        <div>
          <div className="text-sm font-semibold text-gray-900">NoorDisplay</div>
          <div className="text-xs text-gray-400">Admin</div>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 text-xl">
          {menuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* ── MOBILE SLIDE-DOWN MENU ── */}
      {menuOpen && (
        <div className="lg:hidden fixed top-14 left-0 right-0 z-30 bg-white border-b border-gray-100 shadow-lg">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm border-b border-gray-50
                ${pathname === n.href
                  ? 'bg-gray-50 text-gray-900 font-medium'
                  : 'text-gray-600'}`}>
              <span className="text-lg">{n.icon}</span>
              {n.label}
            </Link>
          ))}
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-sm text-red-500">
            <span className="text-lg">→</span> Sign out
          </button>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-52 bg-white border-r border-gray-100 flex-col py-4 z-40">
        <div className="px-4 pb-4 border-b border-gray-100 mb-2">
          <div className="text-sm font-semibold text-gray-900">NoorDisplay</div>
          <div className="text-xs text-gray-400 mt-0.5">Admin panel</div>
        </div>
        <nav className="flex-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors
                ${pathname === n.href
                  ? 'text-gray-900 font-medium bg-gray-50 border-l-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}>
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <button onClick={logout}
          className="mx-4 text-xs text-gray-400 hover:text-gray-700 text-left pb-2">
          Sign out
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="lg:ml-52 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-3xl">
          {children}
        </div>
      </main>

      {/* ── MOBILE BOTTOM TAB BAR ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex">
        {BOTTOM_NAV.map(n => (
          <Link key={n.href} href={n.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors
              ${pathname === n.href
                ? 'text-gray-900'
                : 'text-gray-400'}`}>
            <span className="text-xl leading-none">{n.icon}</span>
            <span className="text-[10px]">{n.label}</span>
            {pathname === n.href && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-gray-900 rounded-t" />
            )}
          </Link>
        ))}
      </nav>

    </div>
  );
}
