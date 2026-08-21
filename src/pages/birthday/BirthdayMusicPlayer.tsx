// src/pages/birthday/BirthdayMusicPlayer.tsx

import React, { useEffect, useRef, useState } from "react";
import { Box, IconButton, Slider, Tooltip, useTheme } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import SkipNextIcon from "@mui/icons-material/SkipNext";

const TRACKS: { title: string; src: string }[] = [
  { title: "Gentle Birthday Piano", src: "/audio/birthday-slow-1.mp3" },
  { title: "Soft Birthday Strings", src: "/audio/birthday-slow-2.mp3" },
  { title: "Warm Acoustic Birthday", src: "/audio/birthday-slow-3.mp3" },
];

const DEFAULT_VOLUME = 0.20;

// Persisted across refreshes/navigation so the player only stays silent
// if the user *deliberately* paused it — otherwise it always comes back.
const PAUSED_STORAGE_KEY = "birthdayMusic:userPaused";

const wasExplicitlyPaused = () => {
  try {
    return localStorage.getItem(PAUSED_STORAGE_KEY) === "1";
  } catch {
    return false; // storage unavailable (e.g. private mode) — default to playing
  }
};

const setExplicitlyPaused = (paused: boolean) => {
  try {
    localStorage.setItem(PAUSED_STORAGE_KEY, paused ? "1" : "0");
  } catch {
    // ignore — worst case it just re-plays on next refresh
  }
};

const BirthdayMusicPlayer: React.FC = () => {
  const theme = useTheme();
  const gold = theme.palette.gold?.main ?? "#F4A93B";
  const isDark = theme.palette.mode === "dark";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [trackIndex, setTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // Always try to play on mount — unless the user explicitly paused on a
  // previous visit, in which case we respect that and stay silent.
  //
  // Browsers allow *muted* autoplay unconditionally but block unmuted
  // autoplay without a prior user gesture. So: start muted immediately
  // (guaranteed to succeed), then try to unmute right away — and if that's
  // blocked, unmute on the very next click/tap/keypress anywhere on the page.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (wasExplicitlyPaused()) {
      return;
    }

    audio.muted = true;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);

        // Try immediately to go unmuted — succeeds if this tab already has
        // a user-activation flag (e.g. arrived via a nav click).
        audio.muted = false;
        audio.play().catch(() => {
          // Still blocked — fall back to unmuting on the next interaction.
          audio.muted = true;
          const unmuteOnFirstInteraction = () => {
            audio.muted = false;
            audio.play().catch(() => {});
          };
          const events: (keyof DocumentEventMap)[] = ["click", "touchstart", "keydown"];
          events.forEach((evt) =>
            document.addEventListener(evt, unmuteOnFirstInteraction, { once: true })
          );
        });
      })
      .catch(() => {
        // Even muted autoplay was blocked (rare) — wait for any interaction.
        const startOnFirstInteraction = () => {
          audio.muted = false;
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        };
        const events: (keyof DocumentEventMap)[] = ["click", "touchstart", "keydown"];
        events.forEach((evt) =>
          document.addEventListener(evt, startOnFirstInteraction, { once: true })
        );
      });
  }, []);

  // *** THE FIX ***
  // Whenever `trackIndex` changes (a track ended, or "skip" was hit), React
  // updates the <audio> element's `src` — but the browser hasn't actually
  // loaded/decoded the new file at that exact instant, so calling .play()
  // immediately can silently fail (that race is why it used to die after
  // track 1). Force a reload of the new source with .load(), then wait for
  // the browser's "canplay" event before calling .play() so we know the
  // file is genuinely ready.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    const tryPlay = () => {
      audio.play().catch(() => {});
    };

    audio.load();
    audio.addEventListener("canplay", tryPlay, { once: true });

    return () => {
      audio.removeEventListener("canplay", tryPlay);
    };
  }, [trackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Advance to the next track (looping the whole playlist) when one ends.
  const handleEnded = () => setTrackIndex((i) => (i + 1) % TRACKS.length);

  // If a track fails to load entirely (404, corrupt file, unsupported
  // codec), don't get stuck silently — just skip forward like it ended.
  const handleError = () => setTrackIndex((i) => (i + 1) % TRACKS.length);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setExplicitlyPaused(true); // remember this choice across refreshes
    } else {
      audio.muted = false;
      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setExplicitlyPaused(false); // user re-enabled it — always play again from now on
        })
        .catch(() => {});
    }
  };

  const skipTrack = () => setTrackIndex((i) => (i + 1) % TRACKS.length);

  return (
    <Box
      sx={{
        position: "fixed",
        zIndex: 20,
        bottom: { xs: 84, md: 24 },
        right: 16,
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        bgcolor: isDark ? "rgba(20,16,40,0.85)" : "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderRadius: 999,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        px: 1,
        py: 0.5,
        border: `1px solid ${gold}44`,
      }}
    >
      <audio
        ref={audioRef}
        src={TRACKS[trackIndex]?.src}
        loop={TRACKS.length === 1}
        onEnded={handleEnded}
        onError={handleError}
        preload="auto"
      />

      <Tooltip title={isPlaying ? "Pause birthday music" : "Play birthday music"}>
        <IconButton size="small" onClick={togglePlay} sx={{ color: gold }}>
          {isPlaying ? <PauseIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Next track">
        <IconButton size="small" onClick={skipTrack} sx={{ color: gold }}>
          <SkipNextIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={muted ? "Unmute" : "Mute"}>
        <IconButton size="small" onClick={() => setMuted((m) => !m)} sx={{ color: gold }}>
          {muted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Slider
        size="small"
        value={muted ? 0 : volume}
        min={0}
        max={1}
        step={0.05}
        onChange={(_, v) => {
          setVolume(v as number);
          if (muted) setMuted(false);
        }}
        sx={{ width: 70, color: gold, mx: 0.5 }}
      />
    </Box>
  );
};

export default BirthdayMusicPlayer;