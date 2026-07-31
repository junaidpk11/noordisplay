'use client';
import { useEffect, useState } from 'react';

function fmt12(t: string | null) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}
function toMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function getHijri() {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
  } catch { return ''; }
}

const PRAYERS = [
  { key: 'fajr',    label: 'Fajr',    iqKey: 'fajrIqamah',    arabic: 'الفجر' },
  { key: 'sunrise', label: 'Sunrise', iqKey: null,             arabic: 'الشروق' },
  { key: 'dhuhr',   label: 'Dhuhr',   iqKey: 'dhuhrIqamah',   arabic: 'الظهر' },
  { key: 'asr',     label: 'Asr',     iqKey: 'asrIqamah',     arabic: 'العصر' },
  { key: 'maghrib', label: 'Maghrib', iqKey: 'maghribIqamah', arabic: 'المغرب' },
  { key: 'isha',    label: 'Isha',    iqKey: 'ishaIqamah',    arabic: 'العشاء' },
];

function getNext(nowMins: number, pt: any) {
  for (let i = 0; i < PRAYERS.length; i++) {
    const t = pt?.[PRAYERS[i].key];
    if (t && toMins(t.substring(0, 5)) > nowMins) return i;
  }
  return 0; // wrap to Fajr
}

export default function MobilePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [data, setData]       = useState<any>(null);
  const [clock, setClock]     = useState('');
  const [nowMins, setNowMins] = useState(0);
  const [hijri]               = useState(getHijri());

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
      setClock(`${h % 12 || 12}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')} ${h>=12?'PM':'AM'}`);
      setNowMins(h * 60 + m);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const load = () => {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', `https://api.atlanticbridgelabs.com/api/display/${slug}`, true);
      xhr.timeout = 8000;
      xhr.onload = () => {
        if (xhr.status === 200) {
          try { setData(JSON.parse(xhr.responseText)); } catch (_) {}
        }
      };
      xhr.send();
    };
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [slug]);

  const pt   = data?.prayerTimes;
  const next = pt ? getNext(nowMins, pt) : -1;

  // Countdown to next prayer
  let countdown = '';
  if (pt && next >= 0) {
    const nextTime = pt[PRAYERS[next].key];
    if (nextTime) {
      const diff = toMins(nextTime.substring(0, 5)) - nowMins;
      const absDiff = diff < 0 ? diff + 1440 : diff;
      countdown = absDiff >= 60
        ? `${Math.floor(absDiff / 60)}h ${String(absDiff % 60).padStart(2, '0')}m`
        : `${absDiff} min`;
    }
  }

  const accentColor = data?.masjid?.accentColor || '#c9a84c';
  const isJumuah = new Date().getDay() === 5;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      color: '#f0ede6',
      fontFamily: "'Inter', sans-serif",
      maxWidth: 480,
      margin: '0 auto',
      padding: '0 0 32px 0',
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #0a0f1a 0%, #0d1117 100%)',
        borderBottom: `1px solid ${accentColor}22`,
        padding: '20px 20px 16px',
      }}>
        <div style={{ fontSize: 11, color: accentColor, letterSpacing: '0.15em', fontWeight: 600, marginBottom: 4 }}>
          {data?.masjid?.name?.toUpperCase() || ''}
        </div>
        <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 12 }}>
          {data?.masjid?.city}, {data?.masjid?.country}
        </div>
        <div style={{ fontSize: 32, fontWeight: 200, color: '#f0ede6', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {clock}
        </div>
        <div style={{ fontSize: 13, color: '#5a6a7a', marginTop: 4, fontStyle: 'italic' }}>
          {hijri}
        </div>
        <div style={{ fontSize: 13, color: '#5a6a7a', fontStyle: 'italic' }}>
          {new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Next prayer countdown */}
      {next >= 0 && countdown && (
        <div style={{
          margin: '16px 16px 0',
          background: `${accentColor}12`,
          border: `1px solid ${accentColor}30`,
          borderRadius: 16,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 11, color: accentColor, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 2 }}>NEXT PRAYER</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: '#f0ede6' }}>{PRAYERS[next].label}</div>
            <div style={{ fontSize: 14, color: '#5a6a7a', fontFamily: "'Amiri', serif" }}>{PRAYERS[next].arabic}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 200, color: accentColor, fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
            <div style={{ fontSize: 13, color: '#4a5568' }}>remaining</div>
          </div>
        </div>
      )}

      {/* Jumu'ah banner */}
      {isJumuah && pt?.jumuah && (
        <div style={{
          margin: '12px 16px 0',
          background: '#1a1200',
          border: `1px solid ${accentColor}40`,
          borderRadius: 12,
          padding: '12px 16px',
          textAlign: 'center',
          fontSize: 13,
          color: accentColor,
        }}>
          🕌 Jumu'ah today · Khutbah at {fmt12(pt.jumuah)} · Please arrive early
        </div>
      )}

      {/* Prayer times */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontSize: 11, color: '#3a4a5a', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>
          PRAYER TIMES
        </div>
        <div style={{ background: '#111827', borderRadius: 16, overflow: 'hidden', border: '1px solid #1c2333' }}>
          {PRAYERS.map((p, i) => {
            const time   = pt?.[p.key];
            const iqTime = p.iqKey ? pt?.[p.iqKey] : null;
            const isNext = i === next;
            const isActive = pt && toMins((pt[p.key] || '00:00').substring(0,5)) <= nowMins &&
              (i === PRAYERS.length - 1 || toMins((pt[PRAYERS[i+1].key] || '24:00').substring(0,5)) > nowMins);

            return (
              <div key={p.key} style={{
                padding: '14px 16px',
                borderBottom: i < PRAYERS.length - 1 ? '1px solid #1c2333' : 'none',
                background: isNext ? `${accentColor}08` : isActive ? '#0f1a0f' : 'transparent',
                borderLeft: isNext ? `3px solid ${accentColor}` : '3px solid transparent',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{
                      fontSize: 15,
                      fontWeight: isNext ? 600 : 400,
                      color: isNext ? '#f0ede6' : '#9aa5b4',
                    }}>{p.label}</span>
                    {isNext && (
                      <span style={{
                        marginLeft: 8,
                        fontSize: 10,
                        background: accentColor,
                        color: '#000',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                      }}>NEXT</span>
                    )}
                    <div style={{ fontSize: 12, color: '#3a4a5a', fontFamily: "'Amiri', serif", marginTop: 1 }}>
                      {p.arabic}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: 17,
                      fontWeight: 500,
                      color: isNext ? accentColor : '#6b7280',
                      fontVariantNumeric: 'tabular-nums',
                    }}>{fmt12(time)}</div>
                    {iqTime && (
                      <div style={{ fontSize: 12, color: '#3a4a5a', marginTop: 1 }}>
                        Iqamah {fmt12(iqTime)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Announcements */}
      {data?.announcements?.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{ fontSize: 11, color: '#3a4a5a', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>
            ANNOUNCEMENTS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.announcements.map((ann: any) => (
              <div key={ann.id} style={{
                background: '#111827',
                border: '1px solid #1c2333',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
                color: '#9aa5b4',
                lineHeight: 1.5,
              }}>
                📢 {ann.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '24px 16px 0',
        textAlign: 'center',
        fontSize: 11,
        color: '#2a3a4a',
        letterSpacing: '0.08em',
      }}>
        NOOR DISPLAY · ATLANTIC BRIDGE LABS
      </div>

    </div>
  );
}
