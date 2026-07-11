'use client';
import { useEffect, useState } from 'react';

export default function TVTest() {
  const [results, setResults] = useState<string[]>(['Starting tests...']);

  const log = (msg: string) => setResults(r => [...r, msg]);

  useEffect(() => {
    const run = async () => {
      // Test 1: Basic JS
      log('✅ JavaScript works');

      // Test 2: localStorage
      try {
        localStorage.setItem('test', '1');
        localStorage.getItem('test');
        log('✅ localStorage works');
      } catch (e) {
        log('❌ localStorage BLOCKED: ' + e);
      }

      // Test 3: fetch direct API
      try {
        const r = await fetch('https://api.atlanticbridgelabs.com/api/display/masjid-al-noor',
          { signal: AbortSignal.timeout(5000) });
        log('✅ Direct API fetch: ' + r.status);
      } catch (e) {
        log('❌ Direct API fetch FAILED: ' + e);
      }

      // Test 4: fetch via proxy
      try {
        const r = await fetch('/api/display/masjid-al-noor',
          { signal: AbortSignal.timeout(5000) });
        log('✅ Proxy fetch: ' + r.status);
      } catch (e) {
        log('❌ Proxy fetch FAILED: ' + e);
      }

      // Test 5: AbortSignal.timeout support
      try {
        AbortSignal.timeout(1000);
        log('✅ AbortSignal.timeout works');
      } catch (e) {
        log('❌ AbortSignal.timeout NOT SUPPORTED: ' + e);
      }

      log('--- Done ---');
    };
    run();
  }, []);

  return (
    <div style={{ background: '#000', color: '#0f0', fontFamily: 'monospace',
      fontSize: 20, padding: 40, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20, color: '#ff0', fontSize: 24 }}>
        NoorDisplay TV Browser Test
      </div>
      {results.map((r, i) => <div key={i} style={{ marginBottom: 8 }}>{r}</div>)}
    </div>
  );
}
