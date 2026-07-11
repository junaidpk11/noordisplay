'use client';

// Detects ws:// vs wss:// based on current page protocol
// Works both locally (http) and in production (https)
function getWsUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:8080/ws';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return apiUrl + '/ws';
}

import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { DisplayPhase } from '@/types';

export function useDisplayPhase(slug: string) {
  const [phase, setPhase] = useState<DisplayPhase>('NORMAL');
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/display/${slug}`, (msg) => {
          const data = JSON.parse(msg.body);
          setPhase(data.phase as DisplayPhase);
        });
      },
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); };
  }, [slug]);

  return phase;
}
