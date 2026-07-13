/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // INTERNAL_API_URL — server-side proxy (Docker: http://backend:8080, Local: http://localhost:8080)
    // NEXT_PUBLIC_API_URL — client-side WebSocket (https://api.atlanticbridgelabs.com)
    const apiBase = process.env.INTERNAL_API_URL ||
                    process.env.NEXT_PUBLIC_API_URL ||
                    'http://localhost:8080';
    return [
      { source: '/api/:path*', destination: `${apiBase}/api/:path*` },
      { source: '/ws/:path*',  destination: `${apiBase}/ws/:path*` },
    ];
  },
};

module.exports = nextConfig;
