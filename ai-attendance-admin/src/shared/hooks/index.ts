import { useEffect, useRef, useCallback, useState } from 'react';

export const usePolling = (callback: () => void, interval: number, enabled = true) => {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => savedCallback.current(), interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
};

export const useWebSocket = (url: string, enabled = true) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onerror = () => ws.close();

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [url, enabled]);

  return wsRef;
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

export const useDisclosure = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  return { isOpen, open, close, toggle };
};
