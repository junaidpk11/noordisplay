import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NoorDisplay',
  description: 'Masjid TV Display Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ height: '100%' }}>
      <head>
        {/* Force TV browsers to render at correct scale — no zoom */}
        <meta name="viewport" content="width=1920, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ height: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}
