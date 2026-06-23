// src/hooks/useAudio.ts
// ─────────────────────────────────────────────────────────────────────────────
// Real audio playback using a single shared HTMLAudioElement.
// Falls back to the fake timer if no audio URL is supplied (so cards without
// audio still show the progress bar for demo purposes).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from "react";

export interface AudioState {
  playing: boolean;
  progress: number;          // 0–100
  articleId: number | null;
  toggle: (id: number, audioUrl?: string | null) => void;
  seek: (val: string | number) => void;
  elapsed: number;           // seconds
  duration: number;          // seconds (real or fake 240)
  DURATION: number;          // alias kept for backward-compat
  fmt: (s: number) => string;
}

const FAKE_DURATION = 240; // fallback when no real audio src

export function useAudio(): AudioState {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fakeRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const [playing,   setPlaying]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [articleId, setArticleId] = useState<number | null>(null);
  const [duration,  setDuration]  = useState(FAKE_DURATION);
  const [isReal,    setIsReal]    = useState(false); // true = using <audio>

  // ── helpers ───────────────────────────────────────────────────────────────
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const stopFake = () => {
    if (fakeRef.current) { clearInterval(fakeRef.current); fakeRef.current = null; }
  };

  const stopReal = () => {
    if (audioRef.current) { audioRef.current.pause(); }
  };

  // ── cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopFake();
      stopReal();
    };
  }, []);

  // ── toggle ────────────────────────────────────────────────────────────────
  const toggle = useCallback((id: number, audioUrl?: string | null) => {
    const switching = articleId !== id;

    if (switching) {
      // Stop whatever was running before
      stopFake();
      stopReal();
      setProgress(0);
      setArticleId(id);
    }

    if (audioUrl) {
      // ── Real audio path ───────────────────────────────────────────────────
      setIsReal(true);
      stopFake();

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;

      if (switching || audio.src !== audioUrl) {
        audio.src = audioUrl;
        audio.load();
      }

      audio.onloadedmetadata = () => {
        setDuration(audio.duration || FAKE_DURATION);
      };

      audio.ontimeupdate = () => {
        const d = audio.duration || 1;
        setProgress((audio.currentTime / d) * 100);
      };

      audio.onended = () => {
        setPlaying(false);
        setProgress(0);
      };

      if (playing && !switching) {
        audio.pause();
        setPlaying(false);
      } else {
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    } else {
      // ── Fake timer path (no audio URL) ────────────────────────────────────
      setIsReal(false);
      stopReal();
      setDuration(FAKE_DURATION);

      if (playing && !switching) {
        stopFake();
        setPlaying(false);
      } else {
        setPlaying(true);
        fakeRef.current = setInterval(() => {
          setProgress(p => {
            if (p >= 100) {
              stopFake();
              setPlaying(false);
              return 0;
            }
            return p + 100 / FAKE_DURATION;
          });
        }, 1000);
      }
    }
  }, [articleId, playing]);

  // ── seek ──────────────────────────────────────────────────────────────────
  const seek = useCallback((val: string | number) => {
    const pct = Number(val);
    setProgress(pct);
    if (isReal && audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (pct / 100) * audioRef.current.duration;
    }
  }, [isReal]);

  const elapsed = Math.round((progress / 100) * duration);

  return {
    playing,
    progress,
    articleId,
    toggle,
    seek,
    elapsed,
    duration,
    DURATION: duration,
    fmt,
  };
}