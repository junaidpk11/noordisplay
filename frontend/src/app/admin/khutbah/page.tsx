'use client';
import { useEffect, useRef, useState } from 'react';

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'ur', label: 'Urdu' },
  { code: 'tr', label: 'Turkish' },
];

interface Caption {
  id: number;
  text: string;
  ts: number;
}

const BAD_PHRASES = [
  'cannot',
  "can't",
  'unable to',
  'i am sorry',
  "i'm sorry",
  'as an ai',
];

function cleanCaptionText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—:;,.]+/, '')
    .trim();
}

function shouldSuppressCaption(value: string, previousValue: string): boolean {
  const text = cleanCaptionText(value);
  if (!text) return true;
  if (text.length < 3) return true;

  const lower = text.toLowerCase();
  if (BAD_PHRASES.some(phrase => lower.includes(phrase))) return true;

  const previous = cleanCaptionText(previousValue).toLowerCase();
  if (previous && previous === lower) return true;

  return false;
}

export default function KhutbahPage() {
  const [slug, setSlug]         = useState('');
  const [lang, setLang]         = useState('en');
  const [running, setRunning]   = useState(false);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [partial, setPartial]   = useState('');
  const [error, setError]       = useState('');
  const [status, setStatus]     = useState('Idle');
  const [relayStatus, setRelayStatus] = useState('Not started');

  const counterRef = useRef(0);
  const sequenceRef = useRef(0);
  const lastFinalTextRef = useRef('');

  const pcRef     = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const dcRef     = useRef<RTCDataChannel | null>(null);
  const silenceTimerRef = useRef<any>(null);

  useEffect(() => {
    setSlug(localStorage.getItem('masjidSlug') || 'masjid-al-noor');
  }, []);

  useEffect(() => {
    return () => {
      pcRef.current?.close();
      streamRef.current?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const token = () => localStorage.getItem('token') || '';

  // Relay finalized caption lines to the backend → WebSocket → TV displays.
  // The TV should only receive stable, committed captions, not word-by-word partials.
  const relayToDisplays = async (text: string) => {
    const cleaned = cleanCaptionText(text);
    if (!cleaned || !slug) return;

    const seq = ++sequenceRef.current;
    setRelayStatus(`Sending line ${seq} to display...`);

    try {
      const res = await fetch(`/api/khutbah/${slug}/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          type: 'caption',
          text: cleaned,
          translated: cleaned,
          english: lang === 'en' ? cleaned : '',
          lang,
          sourceLang: 'ar',
          targetLang: lang,
          isFinal: 'true',
          seq: String(seq),
          timestamp: String(Date.now()),
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `HTTP ${res.status}`);
      }

      setRelayStatus(`Line ${seq} sent to display`);
    } catch (e: any) {
      console.error('Relay error', e);
      setRelayStatus(`Display relay failed: ${e?.message || 'unknown error'}`);
    }
  };

  const start = async () => {
    if (!slug) {
      setError('Missing masjid slug. Please refresh or set masjidSlug in localStorage.');
      return;
    }

    setError('');
    setCaptions([]);
    setPartial('');
    setRelayStatus('Starting display mode...');
    lastFinalTextRef.current = '';
    sequenceRef.current = 0;

    try {
      // 1. Tell displays to enter khutbah mode.
      await fetch(`/api/khutbah/${slug}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });

      // 2. Get ephemeral client secret from backend.
      setStatus('Creating OpenAI session...');
      const sessionRes = await fetch(`/api/khutbah/${slug}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify({
          language: lang,
          sourceLanguage: 'ar',
          sourceLang: 'ar',
        }),
      });

      const sessionData = await sessionRes.json();
      if (!sessionRes.ok || sessionData.error) {
        setError(`Session error: ${sessionData.error || JSON.stringify(sessionData)}`);
        setStatus('Error');
        return;
      }

      const clientSecret = sessionData.value || sessionData.client_secret?.value;
      if (!clientSecret) {
        setError('No client secret returned. Check your backend OpenAI session endpoint.');
        setStatus('Error');
        return;
      }

      // 3. Capture microphone from the admin device near the speaker/audio source.
      setStatus('Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;

      // 4. Create WebRTC peer connection to OpenAI Realtime.
      setStatus('Connecting to OpenAI Realtime...');
      const pc = new RTCPeerConnection();
      pcRef.current = pc;
      pc.addTrack(stream.getAudioTracks()[0], stream);

      // 5. Create data channel for realtime text events.
      const dc = pc.createDataChannel('oai-events');
      dcRef.current = dc;

      let currentSentence = '';

      dc.onmessage = ({ data }) => {
        let event: any;
        try {
          event = JSON.parse(data);
        } catch {
          return;
        }

        // Translated text as it streams. Admin preview only; never relayed to TV.
        if (event.type === 'session.output_transcript.delta' && event.delta) {
          currentSentence += event.delta;
          setPartial(cleanCaptionText(currentSentence));
          setStatus('Translating Arabic speech...');

          const commitAndRelay = () => {
            const finalText = cleanCaptionText(currentSentence);
            currentSentence = '';
            setPartial('');

            if (shouldSuppressCaption(finalText, lastFinalTextRef.current)) return;

            lastFinalTextRef.current = finalText;
            const cap: Caption = {
              id: ++counterRef.current,
              text: finalText,
              ts: Date.now(),
            };
            setCaptions(c => [...c.slice(-29), cap]);
            relayToDisplays(finalText);
          };

          // FIX: "session.output_transcript.done" does not reliably fire,
          // so relayToDisplays() was never called and the TV never received
          // anything until audio stopped entirely. Two triggers now commit
          // and relay text to the display, whichever fires first:
          //
          // 1. Sentence-boundary punctuation (. ! ?) appears in the delta —
          //    fires immediately, mid-speech, at natural sentence breaks.
          // 2. 900ms of silence (no new delta) — catches sentences without
          //    clear punctuation or trailing clauses.
          //
          // This keeps continuous speech flowing to the display in short
          // bursts instead of waiting for the speaker to stop talking.
          if (/[.!?]\s*$/.test(currentSentence.trim())) {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            commitAndRelay();
            return;
          }

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(commitAndRelay, 900);
          return;
        }

        // Final translated sentence. This is the only thing sent to TV displays.
        if (event.type === 'session.output_transcript.done') {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          const finalText = cleanCaptionText(currentSentence || event.transcript || event.text || '');
          currentSentence = '';
          setPartial('');

          if (shouldSuppressCaption(finalText, lastFinalTextRef.current)) return;

          lastFinalTextRef.current = finalText;
          const cap: Caption = {
            id: ++counterRef.current,
            text: finalText,
            ts: Date.now(),
          };

          setCaptions(c => [...c.slice(-29), cap]);
          relayToDisplays(finalText);
          return;
        }

        if (event.type === 'session.created' || event.type === 'session.updated') {
          setStatus('Connected — listening for Arabic speech...');
          return;
        }

        if (event.type === 'error') {
          setError(`OpenAI error: ${event.error?.message || JSON.stringify(event)}`);
          setStatus('Error');
        }
      };

      dc.onopen = () => setStatus('Connected — listening for Arabic speech...');
      dc.onclose = () => setStatus(running ? 'Disconnected' : 'Stopped');

      // 6. Create and send SDP offer.
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpRes = await fetch('https://api.openai.com/v1/realtime/translations/calls', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          'Content-Type': 'application/sdp',
        },
        body: offer.sdp,
      });

      if (!sdpRes.ok) {
        const errText = await sdpRes.text();
        setError(`WebRTC connection failed: ${errText}`);
        setStatus('Error');
        return;
      }

      await pc.setRemoteDescription({
        type: 'answer',
        sdp: await sdpRes.text(),
      });

      setRunning(true);
      setStatus('Connected — listening for Arabic speech...');
      setRelayStatus('Display mode active');
    } catch (e: any) {
      setError(e.message || 'Failed to start translation');
      setStatus('Error');
      setRelayStatus('Failed to start');
    }
  };

  const stop = async () => {
    pcRef.current?.close();
    pcRef.current = null;
    dcRef.current = null;

    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;

    if (slug) {
      await fetch(`/api/khutbah/${slug}/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
    }

    setRunning(false);
    setPartial('');
    setStatus('Stopped');
    setRelayStatus('Display mode stopped');
  };

  const selectedLangLabel = LANG_OPTIONS.find(l => l.code === lang)?.label || 'English';

  return (
    <div className="max-w-4xl">
      <h1 className="text-lg font-medium text-gray-900 mb-1">Live khutbah translation</h1>
      <p className="text-sm text-gray-500 mb-6">
        Arabic speech is translated live and only finalized caption lines are sent to the TV display.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${running ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}/>
            <div>
              <div className="text-sm font-medium text-gray-900">{running ? 'Live' : 'Stopped'}</div>
              <div className="text-xs text-gray-500">{status}</div>
              <div className="text-xs text-gray-400">{relayStatus}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              disabled={running}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {LANG_OPTIONS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>

            {!running ? (
              <button onClick={start} className="bg-gray-900 text-white text-sm px-5 py-2 rounded-lg hover:bg-gray-800">
                Start translation
              </button>
            ) : (
              <button onClick={stop} className="bg-red-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-red-700">
                Stop
              </button>
            )}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-3">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-gray-500">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="font-medium text-gray-700">Source</div>
            <div>Arabic speech</div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="font-medium text-gray-700">Target</div>
            <div>{selectedLangLabel}</div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="font-medium text-gray-700">TV behavior</div>
            <div>Final captions only</div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-gray-900">Admin preview</h2>
          <span className="text-xs text-gray-400">{captions.length} finalized lines</span>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 min-h-64 max-h-[500px] overflow-y-auto">
          {captions.length === 0 && !partial ? (
            <div className="text-gray-500 text-sm italic text-center mt-10">
              {running ? 'Connected — waiting for Arabic speech...' : 'Start translation to see live captions here.'}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {captions.map((cap, i) => {
                const isLatest = i === captions.length - 1 && !partial;
                return (
                  <div
                    key={cap.id}
                    style={{ opacity: isLatest ? 1 : 0.35 + (i / Math.max(captions.length, 1)) * 0.55 }}
                    className={`font-serif italic text-sm ${isLatest ? 'text-gray-100 text-base border-t border-yellow-900 pt-3' : 'text-gray-400 border-b border-gray-800 pb-2'}`}
                  >
                    {cap.text}
                  </div>
                );
              })}

              {partial && (
                <div className="font-serif italic text-base text-gray-100 border-t border-yellow-900 pt-3">
                  {partial}<span className="inline-block w-0.5 h-4 bg-yellow-500 ml-1 animate-pulse align-middle"/>
                  <div className="text-[10px] uppercase tracking-wide text-yellow-600 mt-2 not-italic font-sans">
                    Preview only — not yet shown on TV
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
