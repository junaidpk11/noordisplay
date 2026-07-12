'use client';

// Detects ws:// vs wss:// based on current page protocol
// Works both locally (http) and in production (https)
function getWsUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080/ws';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return apiUrl + '/ws';
}

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { DisplayData } from '@/types';
import { quotes as ALL_QUOTES } from '@/lib/quotes';
import { etiquettes } from '@/lib/etiquettes';
import { useDisplayPhase } from '@/lib/useDisplayPhase';

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
  { key: 'fajr',    label: 'Fajr',    iqKey: 'fajrIqamah' },
  { key: 'sunrise', label: 'Sunrise', iqKey: null },
  { key: 'dhuhr',   label: 'Dhuhr',   iqKey: 'dhuhrIqamah' },
  { key: 'asr',     label: 'Asr',     iqKey: 'asrIqamah' },
  { key: 'maghrib', label: 'Maghrib', iqKey: 'maghribIqamah' },
  { key: 'isha',    label: 'Isha',    iqKey: 'ishaIqamah' },
];

function getActiveNext(nowMins: number, pt: any) {
  let active = 0, next = 1;
  for (let i = 0; i < PRAYERS.length; i++) {
    const t = pt?.[PRAYERS[i].key];
    if (t && toMins(t.substring(0, 5)) <= nowMins) {
      active = i; next = (i + 1) % PRAYERS.length;
    }
  }
  return { active, next };
}

// Build a rotation sequence: every 4 quotes show etiquettes once
function buildSequence(quotes: typeof ALL_QUOTES, showEtiquettes: boolean) {
  type Slide =
    | { type: 'quote'; idx: number }
    | { type: 'etiquettes' };
  const seq: Slide[] = [];
  quotes.forEach((_, i) => {
    seq.push({ type: 'quote', idx: i });
    if (showEtiquettes && (i + 1) % 4 === 0) {
      seq.push({ type: 'etiquettes' });
    }
  });
  return seq;
}

export default function DisplayPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [data, setData]           = useState<DisplayData | null>(null);
  const [clock, setClock]         = useState('');
  const [dateStr, setDateStr]     = useState('');
  const [hijri]                   = useState(getHijri());
  const [nowMins, setNowMins]     = useState(0);
  const [slideIdx, setSlideIdx]   = useState(0);
  const [visible, setVisible]     = useState(true);
  const [bgCurrent, setBgCurrent] = useState('');
  const [bgNext, setBgNext]       = useState('');
  const [bgFade, setBgFade]       = useState(false);
  const [kenBurns, setKenBurns]   = useState(false);
  const [weather, setWeather]     = useState<{temp:string;desc:string;icon:string}|null>(null);
  const [eqPage, setEqPage]       = useState(0); // which 6 etiquettes to show
  const router = useRouter();
  const [khutbahMode, setKhutbahMode] = useState(false);
  const phase = useDisplayPhase(slug);
  const [scheduledSlots, setScheduledSlots] = useState<any[]>([]);
  const [forcedSlide, setForcedSlide]         = useState<string | null>(null);
  const [scheduledCustomMsg, setScheduledCustomMsg] = useState<string>('');
  const [scheduledPosterUrl, setScheduledPosterUrl] = useState<string>('');
  const [scheduledAnnouncements, setScheduledAnnouncements] = useState<any[]>([]);
  const [quoteTypeOverride, setQuoteTypeOverride] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      // Use XMLHttpRequest for maximum TV browser compatibility
      // fetch() is blocked on some smart TV browsers; XHR works everywhere
      const urls = [
        'https://api.atlanticbridgelabs.com/api/display/' + slug,
        window.location.origin + '/api/display/' + slug,
      ];
      let tried = 0;
      const tryUrl = (url: string) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.timeout = 8000;
        xhr.onload = () => {
          if (xhr.status === 200) {
            try {
              const freshData = JSON.parse(xhr.responseText);
              if (freshData?.prayerTimes || freshData?.masjid) {
                setData(freshData);
                return;
              }
            } catch (_) {}
          }
          tried++;
          if (tried < urls.length) tryUrl(urls[tried]);
        };
        xhr.onerror = () => {
          tried++;
          if (tried < urls.length) tryUrl(urls[tried]);
        };
        xhr.ontimeout = () => {
          tried++;
          if (tried < urls.length) tryUrl(urls[tried]);
        };
        xhr.send();
      };
      tryUrl(urls[0]);
    };

    load();

    const refreshId = setInterval(load, 5 * 60 * 1000);

    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
    const midnightId = setTimeout(() => window.location.reload(), msUntilMidnight + 5000);

    return () => { clearInterval(refreshId); clearTimeout(midnightId); };
  }, [slug]);

  // Keep-alive — prevents browser from unloading the page
  useEffect(() => {
    const keepAlive = setInterval(() => {
      // Simple DOM touch — signals page is active without requiring user gesture
      document.title = document.title;
    }, 30000);
    return () => clearInterval(keepAlive);
  }, []);

  // Weather — Open-Meteo, no API key needed
  useEffect(() => {
    if (!data?.masjid) return;
    const { latitude, longitude } = data.masjid;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&temperature_unit=celsius`)
      .then(r => r.json())
      .then(d => {
        const temp = Math.round(d.current.temperature_2m);
        const code = d.current.weathercode;
        const icons: Record<number,string> = {0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',71:'🌨',73:'🌨',75:'❄️',80:'🌦',81:'🌧',82:'⛈',95:'⛈',96:'⛈',99:'⛈'};
        const descs: Record<number,string> = {0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Foggy',48:'Foggy',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',71:'Light snow',73:'Snow',75:'Heavy snow',80:'Showers',81:'Heavy showers',82:'Violent showers',95:'Thunderstorm',96:'Thunderstorm',99:'Thunderstorm'};
        setWeather({ temp:`${temp}°C`, desc:descs[code]??'Clear', icon:icons[code]??'🌤' });
      }).catch(()=>{});
  }, [data?.masjid]);

  // Listen for khutbah mode — auto-redirect display to translation screen
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(getWsUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/khutbah-mode/${slug}`, msg => {
          const data = JSON.parse(msg.body);
          if (data.active) {
            // Redirect all connected displays to the khutbah translation screen
            router.push(`/display/${slug}/khutbah`);
          } else {
            // Imam stopped — come back to normal display
            setKhutbahMode(false);
          }
        });
      },
    });
    client.activate();
    return () => { client.deactivate(); };
  }, [slug]);

  // Listen for scheduler events from backend
  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(getWsUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/schedule/${slug}`, msg => {
          const payload = JSON.parse(msg.body);
          const active: any[] = payload.activeSlots || [];
          setScheduledSlots(active);

          const etiq     = active.find((s: any) => s.type === 'ETIQUETTE');
          const custom   = active.find((s: any) => s.type === 'CUSTOM');
          const poster   = active.find((s: any) => s.type === 'POSTER');
          const quran    = active.find((s: any) => s.type === 'QURAN');
          const hadith   = active.find((s: any) => s.type === 'HADITH');
          const announce = active.filter((s: any) => s.type === 'ANNOUNCEMENT' && s.message);

          // Forced slide priority: ETIQUETTE > POSTER > CUSTOM
          if (etiq)         setForcedSlide('etiquettes');
          else if (poster)  setForcedSlide('poster');
          else if (custom)  setForcedSlide('custom');
          else              setForcedSlide(null);

          // Quote type override: QURAN or HADITH slots filter the quote pool
          if (quran && !hadith)       setQuoteTypeOverride('QURAN');
          else if (hadith && !quran)  setQuoteTypeOverride('HADITH');
          else                        setQuoteTypeOverride(null);

          // Store content for each type
          setScheduledCustomMsg(custom?.message || '');
          setScheduledPosterUrl(poster?.imageUrl || '');
          setScheduledAnnouncements(announce);
        });
      },
    });
    client.activate();
    return () => { client.deactivate(); };
  }, [slug]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const hh = now.getHours();
      const mm = String(now.getMinutes()).padStart(2,'0');
      const ss = String(now.getSeconds()).padStart(2,'0');
      setClock(`${hh%12||12}:${mm}:${ss} ${hh>=12?'PM':'AM'}`);
      const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
      setDateStr(`${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
      setNowMins(hh*60+now.getMinutes());
    };
    tick();
    const id = setInterval(tick,1000);
    return ()=>clearInterval(id);
  },[]);

  const filteredQuotes = (() => {
    const base = data
      ? ALL_QUOTES.filter(q => !data.features?.quoteSource || data.features.quoteSource==='BOTH' || q.type===data.features.quoteSource)
      : ALL_QUOTES;
    // If a QURAN or HADITH slot is active, override the quote pool
    if (quoteTypeOverride) return base.filter(q => q.type === quoteTypeOverride);
    return base;
  })();

  // showEtiquettes could be a feature toggle — default true
  const showEtiquettes = true;
  const sequence = buildSequence(filteredQuotes, showEtiquettes);
  const currentSlide = (() => {
    if (forcedSlide === 'etiquettes') return { type: 'etiquettes' as const };
    if (forcedSlide === 'poster')     return { type: 'poster' as const };
    if (forcedSlide === 'custom')     return { type: 'custom' as const };
    return sequence[slideIdx % sequence.length];
  })();

  useEffect(() => {
    if (filteredQuotes.length > 0) setBgCurrent(filteredQuotes[0].bg||'');
  }, [data]);

  // Rotation timer
  useEffect(() => {
    if (!data) return;
    const secs = (data.features?.quoteIntervalSecs ?? 12) * 1000;
    setKenBurns(false);
    const kb = setTimeout(()=>setKenBurns(true), 100);

    const id = setInterval(() => {
      const nextSlideIdx = (slideIdx + 1) % sequence.length;
      const nextSlide = sequence[nextSlideIdx];
      const nextBg = nextSlide.type==='quote' ? (filteredQuotes[nextSlide.idx]?.bg||'') : '';

      setVisible(false);
      setBgNext(nextBg);
      setBgFade(true);

      setTimeout(() => {
        setSlideIdx(nextSlideIdx);
        setBgCurrent(nextBg);
        setBgFade(false);
        setVisible(true);
        setKenBurns(false);
        setTimeout(()=>setKenBurns(true), 100);
        // Rotate which 6 etiquettes we show each time
        if (nextSlide.type==='etiquettes') {
          setEqPage(p => (p+1) % Math.ceil(etiquettes.length/6));
        }
      }, 900);
    }, secs);
    return ()=>{ clearInterval(id); clearTimeout(kb); };
  }, [data, slideIdx, sequence.length]);

  const quote = currentSlide?.type==='quote' ? filteredQuotes[currentSlide.idx] : null;
  const pt = data?.prayerTimes;
  const { active, next } = getActiveNext(nowMins, pt);
  const nextPrayer = PRAYERS[next];
  const nextTime = pt?.[nextPrayer.key as keyof typeof pt] as string;
  let diff = nextTime ? toMins(nextTime.substring(0,5)) - nowMins : 0;
  if (diff<0) diff+=1440;
  const countdown = diff>=60 ? `${Math.floor(diff/60)}h ${String(diff%60).padStart(2,'0')}m` : `${diff} min`;
  const wideMode = diff>30 && currentSlide?.type==='quote';
  const isFriday = new Date().getDay()===5;

  // Etiquettes slice — 6 per page, cycling through all 12
  const eqSlice = etiquettes.slice(eqPage*6, eqPage*6+6);

  // Shared right panel
  const PrayerPanel = () => (
    <div style={{background:'#080c12',display:'flex',flexDirection:'column'}}>
      <div style={{fontSize:9,color:'#4a5568',letterSpacing:'0.1em',textTransform:'uppercase',padding:'14px 16px 8px',borderBottom:'1px solid #1c2333',fontFamily:"'Inter',sans-serif"}}>
        Prayer times
      </div>
      <div style={{flex:1,padding:'6px 0'}}>
        {PRAYERS.map((p,i)=>{
          const time = pt?.[p.key as keyof typeof pt] as string;
          const iqTime = p.iqKey ? pt?.[p.iqKey as keyof typeof pt] as string : null;
          const isActive=i===active, isNext=i===next;
          return (
            <div key={p.key} style={{padding:'5px 16px',paddingLeft:isActive?14:16,background:isActive?'#111827':'transparent',borderLeft:isActive?'2px solid #c9a84c':'2px solid transparent',transition:'background 0.5s'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:500,color:isActive?'#f0ede6':'#6b7280'}}>
                  {p.label}
                  {isNext&&<span style={{fontSize:9,background:'#c9a84c18',color:'#c9a84c',padding:'1px 5px',borderRadius:3,marginLeft:5,fontWeight:500}}>next</span>}
                </span>
                <span style={{fontSize:12,fontWeight:500,color:isActive?'#c9a84c':'#6b7280',fontVariantNumeric:'tabular-nums'}}>{fmt12(time)}</span>
              </div>
              {iqTime&&<div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:isActive?'#4a5568':'#2d3748',paddingTop:1,paddingBottom:2}}><span>Iqamah</span><span>{fmt12(iqTime)}</span></div>}
            </div>
          );
        })}
      </div>
      {/* Next prayer mini strip inside panel */}
      <div style={{borderTop:'1px solid #1c2333',padding:'10px 16px',background:'#060a0f'}}>
        <div style={{fontSize:9,color:'#4a5568',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:3}}>Next</div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}>
          <span style={{fontSize:13,fontFamily:"'Cinzel',serif",color:'#f0ede6',letterSpacing:'0.04em'}}>{nextPrayer.label}</span>
          <span style={{fontSize:16,fontWeight:200,color:'#c9a84c',fontVariantNumeric:'tabular-nums'}}>{countdown}</span>
        </div>
      </div>
    </div>
  );

  if (!data) return (
    <div style={{height:'100vh',background:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center'}}>
      <span style={{fontFamily:'Amiri,serif',fontSize:24,color:'#c9a84c'}}>Loading...</span>
    </div>
  );

  return (
    <div style={{height:'100vh',background:'#0d1117',color:'#f0ede6',fontFamily:"'Inter',sans-serif",display:'flex',flexDirection:'column'}}>
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Inter:wght@200;300;400;500&family=Cinzel:wght@400;500&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Noto+Naskh+Arabic:wght@400;500;600&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes ticker{from{transform:translateX(100vw)}to{transform:translateX(-100%)}}
        @keyframes kenburns{from{transform:scale(1) translate(0,0)}to{transform:scale(1.08) translate(-1%,-1%)}}
        @keyframes arabesque-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeInUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .bg-layer{position:absolute;inset:0;background-size:cover;background-position:center;transition:opacity 0.9s ease;}
        .kb-active{animation:kenburns 30s ease-out forwards;}
        .top-gold-line{height:2px;background:linear-gradient(to right,transparent,#c9a84c55,#c9a84c,#c9a84c55,transparent);}
        .eq-card{background:#ffffff06;border:1px solid #1c2333;border-radius:8px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;animation:fadeInUp 0.5s ease both;}
      `}</style>

      <div className="top-gold-line"/>

      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 28px',background:'#0d1117',borderBottom:'1px solid #1c2333',position:'relative',zIndex:10}}>
        <div>
          <div style={{fontSize:15,fontWeight:500,color:'#c9a84c',letterSpacing:'0.06em',fontFamily:"'Cinzel',serif"}}>{data.masjid.name} &nbsp;·&nbsp; {data.masjid.city}</div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:5}}>
            <div style={{fontSize:13,color:'#5a6a7a',fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>{hijri}</div>
            {weather&&(
              <>
                <div style={{width:1,height:12,background:'#1c2333'}}/>
                <div style={{display:'flex',alignItems:'center',gap:5}}>
                  <span style={{fontSize:14}}>{weather.icon}</span>
                  <span style={{fontSize:12,fontWeight:300,color:'#b8cce0',fontFamily:"'Inter',sans-serif"}}>{weather.temp}</span>
                  <span style={{fontSize:11,color:'#4a5568',fontFamily:"'Inter',sans-serif"}}>{weather.desc}</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div style={{textAlign:'right'}}>
          <div style={{fontSize:34,fontWeight:200,letterSpacing:'0.04em',fontVariantNumeric:'tabular-nums',lineHeight:1,fontFamily:"'Inter',sans-serif"}}>{clock}</div>
          <div style={{fontSize:14,color:'#5a6a7a',marginTop:5,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>{dateStr}</div>
        </div>
      </div>

      {/* Jumu'ah banner */}
      {isFriday&&data.features?.showJumuahBanner&&(
        <div style={{background:'#c9a84c',color:'#0d1117',textAlign:'center',padding:'8px 24px',fontSize:13,fontWeight:500,position:'relative',zIndex:10,fontFamily:"'Cinzel',serif",letterSpacing:'0.04em'}}>
          Jumu'ah today &nbsp;·&nbsp; Khutbah at {fmt12(pt?.jumuah||'13:15:00')} &nbsp;·&nbsp; Please arrive early
        </div>
      )}

      {/* Main body */}
      <div style={{flex:1,display:'grid',gridTemplateColumns:wideMode?'1fr 190px':'1fr 210px',transition:'grid-template-columns 1s ease',minHeight:0,overflow:'hidden'}}>

        {/* ── QUOTE SLIDE ── */}
        {currentSlide?.type==='quote' && (
          <div style={{display:'flex',flexDirection:'column',borderRight:'1px solid #1c2333'}}>
            <div style={{flex:1,position:'relative',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
              <div className={`bg-layer ${kenBurns?'kb-active':''}`} style={{backgroundImage:bgCurrent?`url(${bgCurrent})`:'none',backgroundColor:'#0d1117',opacity:1}}/>
              <div className="bg-layer" style={{backgroundImage:bgNext?`url(${bgNext})`:'none',opacity:bgFade?1:0}}/>
              {/* Arabesque overlay */}
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.04,pointerEvents:'none',zIndex:1}}>
                <svg width="500" height="500" viewBox="0 0 200 200" style={{animation:'arabesque-spin 120s linear infinite'}}>
                  <g fill="none" stroke="#c9a84c" strokeWidth="0.4">
                    {[0,30,60,90,120,150].map(a=>(
                      <g key={a} transform={`rotate(${a} 100 100)`}>
                        <circle cx="100" cy="40" r="28"/><circle cx="100" cy="160" r="28"/>
                        <circle cx="40" cy="100" r="28"/><circle cx="160" cy="100" r="28"/>
                      </g>
                    ))}
                    <circle cx="100" cy="100" r="55"/><circle cx="100" cy="100" r="38"/><circle cx="100" cy="100" r="20"/>
                    {[0,45,90,135].map(a=><line key={a} x1="100" y1="10" x2="100" y2="190" transform={`rotate(${a} 100 100)`}/>)}
                  </g>
                </svg>
              </div>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.5) 50%,rgba(0,0,0,0.65) 100%)',zIndex:1}}/>
              <div style={{position:'relative',zIndex:2,textAlign:'center',padding:'28px 40px',transition:'opacity 0.7s',opacity:visible?1:0}}>
                <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:wideMode?35:30,color:'#f5e6c0',lineHeight:1.9,direction:'rtl',marginBottom:18,fontWeight:600}}>{quote?.arabic}</div>
                <div style={{fontSize:wideMode?22:20,color:'#e0d8cc',fontStyle:'italic',lineHeight:1.6,maxWidth:wideMode?560:440,marginBottom:12,fontFamily:"'Cormorant Garamond',serif",fontWeight:500}}>"{quote?.en}"</div>
                <div style={{fontSize:11,color:'#c9a84c',letterSpacing:'0.08em',fontFamily:"'Inter',sans-serif",fontWeight:400,textTransform:'uppercase' as const}}>
                  <div style={{width:28,height:1,background:'#c9a84c55',margin:'0 auto 8px'}}/>
                  {quote?.src}
                </div>
              </div>
              <div style={{position:'relative',zIndex:2,display:'flex',gap:5,justifyContent:'center',paddingBottom:16}}>
                {sequence.map((_,i)=>(
                  <div key={i} style={{width:i===slideIdx%sequence.length?16:4,height:4,borderRadius:2,background:i===slideIdx%sequence.length?'#c9a84c':'rgba(255,255,255,0.15)',transition:'all 0.4s ease'}}/>
                )).slice(0, Math.min(sequence.length, 12))}
              </div>
            </div>
            {/* Next prayer strip */}
            <div style={{background:'#080c12',borderTop:'1px solid #1c2333',padding:'12px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:9,color:'#4a5568',letterSpacing:'0.1em',textTransform:'uppercase'}}>Next prayer</div>
                <div style={{fontSize:15,fontWeight:400,color:'#f0ede6',marginTop:3,fontFamily:"'Cinzel',serif",letterSpacing:'0.04em'}}>{nextPrayer.label}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:24,fontWeight:200,color:'#c9a84c',fontVariantNumeric:'tabular-nums'}}>{countdown}</div>
                <div style={{fontSize:10,color:'#4a5568',marginTop:1,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* ── POSTER SLIDE ── */}
        {currentSlide?.type==='poster' && (
          <div style={{display:'flex',flexDirection:'column',borderRight:'1px solid #1c2333',position:'relative',overflow:'hidden'}}>
            <div style={{flex:1,position:'relative',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
              {scheduledPosterUrl ? (
                <>
                  <div style={{position:'absolute',inset:0,backgroundImage:`url(${scheduledPosterUrl})`,backgroundSize:'contain',backgroundPosition:'center',backgroundRepeat:'no-repeat'}}/>
                  <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.3)'}}/>
                </>
              ) : (
                <div style={{position:'absolute',inset:0,background:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{textAlign:'center',color:'#4a5568'}}>
                    <div style={{fontSize:40,marginBottom:12}}>🖼</div>
                    <div style={{fontFamily:"'Cinzel',serif",fontSize:13,letterSpacing:'0.06em'}}>No image uploaded</div>
                    <div style={{fontSize:11,marginTop:6}}>Upload a poster image in the admin panel</div>
                  </div>
                </div>
              )}
            </div>
            <div style={{background:'#080c12',borderTop:'1px solid #1c2333',padding:'12px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:9,color:'#4a5568',letterSpacing:'0.1em',textTransform:'uppercase'}}>Next prayer</div>
                <div style={{fontSize:15,fontWeight:400,color:'#f0ede6',marginTop:3,fontFamily:"'Cinzel',serif",letterSpacing:'0.04em'}}>{nextPrayer.label}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:24,fontWeight:200,color:'#c9a84c',fontVariantNumeric:'tabular-nums'}}>{countdown}</div>
                <div style={{fontSize:10,color:'#4a5568',marginTop:1,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* ── CUSTOM SLIDE ── */}
        {currentSlide?.type==='custom' && (
          <div style={{display:'flex',flexDirection:'column',borderRight:'1px solid #1c2333',background:'#0a0f1a'}}>
            <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',padding:'32px 48px',textAlign:'center',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.04,pointerEvents:'none'}}>
                <svg width="500" height="400" viewBox="0 0 200 160">
                  <g fill="none" stroke="#c9a84c" strokeWidth="0.3">
                    <circle cx="100" cy="80" r="60"/><circle cx="100" cy="80" r="40"/><circle cx="100" cy="80" r="22"/>
                    {([0,45,90,135] as number[]).map((a:number)=><line key={a} x1="100" y1="5" x2="100" y2="155" transform={`rotate(${a} 100 80)`}/>)}
                  </g>
                </svg>
              </div>
              <div style={{position:'relative',zIndex:2}}>
                <div style={{width:32,height:1,background:'#c9a84c55',margin:'0 auto 20px'}}/>
                <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:32,color:'#f5e6c0',fontWeight:600,lineHeight:1.6,marginBottom:20,direction:'rtl'}}>
                  {scheduledCustomMsg}
                </div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:'#b8cce0',fontStyle:'italic',lineHeight:1.5}}>
                  {scheduledCustomMsg}
                </div>
                <div style={{width:32,height:1,background:'#c9a84c55',margin:'20px auto 0'}}/>
              </div>
            </div>
            <div style={{background:'#080c12',borderTop:'1px solid #1c2333',padding:'12px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:9,color:'#4a5568',letterSpacing:'0.1em',textTransform:'uppercase'}}>Next prayer</div>
                <div style={{fontSize:15,fontWeight:400,color:'#f0ede6',marginTop:3,fontFamily:"'Cinzel',serif",letterSpacing:'0.04em'}}>{nextPrayer.label}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:24,fontWeight:200,color:'#c9a84c',fontVariantNumeric:'tabular-nums'}}>{countdown}</div>
                <div style={{fontSize:10,color:'#4a5568',marginTop:1,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ETIQUETTES SLIDE ── */}
        {currentSlide?.type==='etiquettes' && (
          <div style={{display:'flex',flexDirection:'column',borderRight:'1px solid #1c2333',background:'#0a0f1a',position:'relative',overflow:'hidden'}}>
            {/* Subtle arabesque bg */}
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',opacity:0.03,pointerEvents:'none'}}>
              <svg width="600" height="400" viewBox="0 0 200 140">
                <g fill="none" stroke="#c9a84c" strokeWidth="0.3">
                  <circle cx="100" cy="70" r="55"/><circle cx="100" cy="70" r="38"/><circle cx="100" cy="70" r="22"/>
                  {[0,45,90,135].map(a=><line key={a} x1="100" y1="5" x2="100" y2="135" transform={`rotate(${a} 100 70)`}/>)}
                </g>
              </svg>
            </div>
            <div style={{flex:1,padding:'20px 28px',position:'relative',zIndex:2,transition:'opacity 0.7s',opacity:visible?1:0}}>
              {/* Section label */}
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
                <div style={{flex:1,height:1,background:'#c9a84c22'}}/>
                <div style={{fontSize:9,letterSpacing:'0.14em',textTransform:'uppercase' as const,color:'#c9a84c88',fontFamily:"'Cinzel',serif"}}>Masjid etiquettes</div>
                <div style={{flex:1,height:1,background:'#c9a84c22'}}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                {eqSlice.map((eq,i)=>(
                  <div key={i} className="eq-card" style={{animationDelay:`${i*0.07}s`}}>
                    <div style={{fontSize:18,flexShrink:0,marginTop:1}}>{eq.icon}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:500,color:'#f0ede6',marginBottom:4,fontFamily:"'Inter',sans-serif"}}>{eq.title}</div>
                      <div style={{fontSize:13,color:'#6b7280',lineHeight:1.5}}>{eq.desc}</div>
                      <div style={{fontFamily:"'Noto Naskh Arabic',serif",fontSize:15,color:'#c9a84c88',direction:'rtl',marginTop:5}}>{eq.arabic}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Next prayer strip — same as quote slide */}
            <div style={{background:'#080c12',borderTop:'1px solid #1c2333',padding:'12px 28px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontSize:9,color:'#4a5568',letterSpacing:'0.1em',textTransform:'uppercase'}}>Next prayer</div>
                <div style={{fontSize:15,fontWeight:400,color:'#f0ede6',marginTop:3,fontFamily:"'Cinzel',serif",letterSpacing:'0.04em'}}>{nextPrayer.label}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:24,fontWeight:200,color:'#c9a84c',fontVariantNumeric:'tabular-nums'}}>{countdown}</div>
                <div style={{fontSize:10,color:'#4a5568',marginTop:1,fontFamily:"'Cormorant Garamond',serif",fontStyle:'italic'}}>remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* Right: prayer panel — always visible */}
        <PrayerPanel/>
      </div>

      {/* Scheduled announcement overlay */}
      {scheduledAnnouncements.map((s: any) => (
        <div key={s.id} style={{
          background: '#c9a84c', color: '#0d1117',
          textAlign: 'center', padding: '9px 24px',
          fontSize: 13, fontWeight: 500,
          fontFamily: "'Cinzel', serif", letterSpacing: '0.04em',
          position: 'relative', zIndex: 10,
        }}>
          {s.message}
        </div>
      ))}

      {/* Ticker */}
      {data.features?.showTicker&&data.announcements?.length>0&&(
        <div style={{background:'#080c12',borderTop:'1px solid #1c2333',padding:'8px 20px',display:'flex',alignItems:'center',gap:12,overflow:'hidden'}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'#c9a84c',flexShrink:0}}/>
          <div style={{flex:1,overflow:'hidden'}}>
            <span style={{fontSize:11,color:'#4a5568',whiteSpace:'nowrap',display:'inline-block',animation:'ticker 30s linear infinite'}}>
              {data.announcements.map((a:any)=>a.message).join('  ·  ')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
