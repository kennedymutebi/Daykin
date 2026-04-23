import { useState, useRef, useEffect } from "react";

export interface AudioState {
  playing: boolean;
  progress: number;
  articleId: number | null;
  toggle: (id: number) => void;
  seek: (val: string | number) => void;
  elapsed: number;
  DURATION: number;
  fmt: (s: number) => string;
}

export function useAudio(): AudioState {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [articleId, setArticleId] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const DURATION = 240;

  const play = (id: number) => {
    if (articleId !== id) { setProgress(0); setArticleId(id); }
    setPlaying(true);
  };
  const pause = () => setPlaying(false);
  const toggle = (id: number) =>
    playing && articleId === id ? pause() : play(id);
  const seek = (val: string | number) => setProgress(Number(val));

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (playing) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { setPlaying(false); return 0; }
          return p + 100 / DURATION;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing]);

  const elapsed = Math.round((progress / 100) * DURATION);
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return { playing, progress, articleId, toggle, seek, elapsed, DURATION, fmt };
}