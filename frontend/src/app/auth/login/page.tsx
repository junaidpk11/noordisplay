'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError('Invalid email or password.');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('masjidId', data.masjidId);
      localStorage.setItem('masjidSlug', data.slug || 'masjid-al-noor');
      router.push('/admin');
    } catch {
      setError('Could not reach server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-xl font-medium text-gray-900">NoorDisplay</div>
          <div className="text-sm text-gray-500 mt-1">Sign in to your admin panel</div>
        </div>
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">{error}</div>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Password</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoComplete="current-password"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gray-900 text-white text-sm py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
