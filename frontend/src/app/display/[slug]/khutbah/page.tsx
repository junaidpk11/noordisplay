'use client';

// Detects ws:// vs wss:// based on current page protocol
// Works both locally (http) and in production (https)
function getWsUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080/ws';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return apiUrl + '/ws';
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

interface Caption {
  id: number;
  seq?: number;
  text: string;
  secondary?: string;
  receivedAt: number;
}

// Simple line-by-line fade: newest line fully bright, each older line a
// little dimmer, oldest (10th) nearly gone. Uniform font size for all lines —
// no per-line size jumps, just opacity fading with age.
const MAX_VISIBLE_LINES = 18;
const LINE_FONT_SIZE = 26;

function lineOpacity(fromBottom: number, total: number): number {
  // fromBottom: 0 = newest (bottom), increasing toward oldest (top)
  const minOpacity = 0.12;
  const maxOpacity = 1;
  if (total <= 1) return maxOpacity;
  const t = fromBottom / (total - 1); // 0 (newest) -> 1 (oldest)
  return maxOpacity - t * (maxOpacity - minOpacity);
}

const BAD_PHRASES = [
  'cannot',
  "can't",
  'unable to',
  'i am sorry',
  "i'm sorry",
  'as an ai',
];

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:;,.]+/, '')
    .trim();
}

function getCaptionText(data: any): string {
  // Support both the new recommended payload and your existing backend payload.
  return cleanText(data?.text)
    || cleanText(data?.english)
    || cleanText(data?.translated)
    || cleanText(data?.translation);
}

function shouldIgnoreCaption(text: string, previousText: string): boolean {
  if (!text || text.length < 3) return true;

  const lower = text.toLowerCase();
  if (BAD_PHRASES.some(phrase => lower.includes(phrase))) return true;

  const previous = previousText.toLowerCase();
  if (previous && previous === lower) return true;

  return false;
}

function isExplicitlyNonFinal(data: any): boolean {
  const value = data?.isFinal ?? data?.final;
  return value === false || value === 'false' || value === 0 || value === '0';
}

function getWebSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_URL;
  if (configured) return configured;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return apiUrl + '/ws';
}

export default function KhutbahDisplay({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();

  const [captions, setCaptions] = useState<Caption[]>([]);
  const [clock, setClock] = useState('');
  const [connected, setConnected] = useState(false);
  const [active, setActive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const counterRef = useRef(0);
  const lastTextRef = useRef('');
  const seenSeqRef = useRef<Set<number>>(new Set());

  const visible = useMemo(() => captions.slice(-18), [captions]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getHours();
      setClock(`${h % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(getWebSocketUrl()),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);

        client.subscribe(`/topic/khutbah-mode/${slug}`, msg => {
          const data = JSON.parse(msg.body);
          const isActive = Boolean(data.active);
          setActive(isActive);

          if (!isActive) {
            setCaptions([]);
            router.push(`/display/${slug}`);
          }
        });

        client.subscribe(`/topic/khutbah/${slug}`, msg => {
          let data: any;
          try {
            data = JSON.parse(msg.body);
          } catch {
            return;
          }

          // TV display should show finalized/committed captions only.
          // Existing backend payloads may not include isFinal, so absence is treated as final.
          if (isExplicitlyNonFinal(data)) return;

          const seq = Number(data.seq ?? data.chunkIndex ?? NaN);
          if (Number.isFinite(seq)) {
            if (seenSeqRef.current.has(seq)) return;
            seenSeqRef.current.add(seq);
            if (seenSeqRef.current.size > 200) {
              const recent = Array.from(seenSeqRef.current).slice(-100);
              seenSeqRef.current = new Set(recent);
            }
          }

          const text = getCaptionText(data);
          if (shouldIgnoreCaption(text, lastTextRef.current)) return;

          lastTextRef.current = text;
          setLastUpdate(Date.now());

          setCaptions(current => [
            ...current.slice(-17),
            {
              id: ++counterRef.current,
              seq: Number.isFinite(seq) ? seq : undefined,
              text,
              secondary: cleanText(data.secondary),
              receivedAt: Date.now(),
            },
          ]);
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [router, slug]);

  return (
    <div style={{
      height: '100dvh', minHeight: '100vh',
      background: '#08090f',
      color: '#f0ede6',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600&family=Inter:wght@200;300;400;500&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .live-dot { animation: pulse 1.8s ease-in-out infinite; }
        .caption-new { animation: slideUp 0.55s ease both; }
      `}</style>

      <div style={{ height: 3, background: 'linear-gradient(to right,transparent,#c9a84c55,#c9a84c,#c9a84c55,transparent)' }}/>

      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        padding:'14px 42px',
        borderBottom:'1px solid #1c2333',
        background: '#070811cc',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
          <div style={{
            display:'flex',
            alignItems:'center',
            gap:8,
            background: connected && active ? '#c9a84c18' : '#2a334318',
            border: connected && active ? '1px solid #c9a84c44' : '1px solid #4a556844',
            padding:'6px 16px',
            borderRadius:20,
          }}>
            <div className="live-dot" style={{
              width:7,
              height:7,
              borderRadius:'50%',
              background: connected && active ? '#c9a84c' : '#4a5568',
            }}/>
            <span style={{
              fontSize:12,
              color: connected && active ? '#c9a84c' : '#8a96a8',
              letterSpacing:'0.12em',
              textTransform:'uppercase',
              fontWeight:500,
            }}>
              {connected ? 'Live translation' : 'Connecting...'}
            </span>
          </div>

          {lastUpdate && (
            <span style={{ fontSize: 11, color: '#4a5568', letterSpacing: '0.06em' }}>
              Caption received
            </span>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:22 }}>
          <div style={{ fontSize:18, fontWeight:200, fontVariantNumeric:'tabular-nums', color:'#8a96a8' }}>{clock}</div>
          <div style={{ fontFamily:"'Cinzel',serif", fontSize:12, color:'#c9a84c55', letterSpacing:'0.1em' }}>NoorDisplay</div>
        </div>
      </div>

      <div style={{
        flex:1,
        display:'flex',
        flexDirection:'column',
        justifyContent:'center',
        padding:'48px 90px 58px',
        position:'relative',
        overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:0.022, pointerEvents:'none' }}>
          <svg width="720" height="720" viewBox="0 0 200 200">
            <g fill="none" stroke="#c9a84c" strokeWidth="0.3">
              {[0,30,60,90,120,150].map(a=>(
                <g key={a} transform={`rotate(${a} 100 100)`}>
                  <circle cx="100" cy="40" r="32"/>
                </g>
              ))}
              <circle cx="100" cy="100" r="60"/>
              <circle cx="100" cy="100" r="40"/>
            </g>
          </svg>
        </div>

        {captions.length === 0 && (
          <div style={{ textAlign:'center', position:'relative', zIndex:2, paddingBottom:60 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, color:'#4a5568', fontStyle:'italic', marginBottom:12 }}>
              Waiting for the khutbah to begin...
            </div>
            <div style={{ fontSize:13, color:'#2a3a4a', letterSpacing:'0.08em', textTransform:'uppercase' }}>
              Translation will appear here automatically
            </div>
          </div>
        )}

        <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', gap:8 }}>
          {visible.map((cap, i) => {
            const fromBottom = visible.length - 1 - i; // 0 = newest line, at the bottom
            const isNewest = fromBottom === 0;
            const opacity = lineOpacity(fromBottom, visible.length);

            return (
              <div
                key={cap.id}
                className={isNewest ? 'caption-new' : ''}
                style={{
                  opacity,
                  transition: 'opacity 0.6s ease',
                }}
              >
                <div style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: LINE_FONT_SIZE,
                  fontStyle: 'italic',
                  color: '#f8f3e7',
                  lineHeight: 1.4,
                  fontWeight: 500,
                }}>
                  {cap.text}
                </div>

                {cap.secondary && (
                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: LINE_FONT_SIZE * 0.6,
                    color: '#c9a84c',
                    fontStyle: 'italic',
                    marginTop: 4,
                    lineHeight: 1.4,
                  }}>
                    {cap.secondary}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        padding:'12px 42px',
        borderTop:'1px solid #1c2333',
        background:'#06070d',
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        fontSize:11,
        color:'#3b4658',
        letterSpacing: '0.02em',
      }}>
        <span>Live AI translation — may contain inaccuracies. Refer to the original Arabic.</span>
        <span style={{ fontFamily:"'Cinzel',serif", letterSpacing:'0.1em', color:'#c9a84c55' }}>NoorDisplay</span>
      </div>
    </div>
  );
}
