import React from "react";
import { useTheme } from "@mui/material/styles";
import { SERIF } from "./constants";
import type { AudioState } from "../../hooks/useAudio";

export const PlayIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);
export const PauseIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

interface Props { articleId: number; audio: AudioState; color: string; }

export const AudioControls: React.FC<Props> = ({ articleId, audio, color }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const isActive  = audio.articleId === articleId;
  const isPlaying = isActive && audio.playing;

  // Playing state: a tinted fill using the accent color
  // Idle state:    a subtle surface tint from the theme
  const bgPlaying = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
  const bgIdle    = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const border    = isDark ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)";

  return (
    <div>
      <button
        onClick={() => audio.toggle(articleId)}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: isPlaying ? bgPlaying : bgIdle,
          border: `1px solid ${border}`,
          padding: "0.45rem 0.8rem",
          borderRadius: 2,
          cursor: "pointer",
          fontFamily: SERIF,
          fontSize: "0.78rem",
          // Use theme text colors so it reads well in both modes
          color: isPlaying
            ? theme.palette.text.primary
            : theme.palette.text.secondary,
          width: "fit-content",
          transition: "all 0.2s",
        }}
      >
        {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
        {isPlaying ? "Pause" : "Listen"}
        {isActive && (
          <span style={{
            marginLeft: 4,
            opacity: 0.6,
            fontSize: "0.72rem",
            color: theme.palette.text.secondary,
          }}>
            {audio.fmt(audio.elapsed)}
          </span>
        )}
      </button>

      {isActive && (
        <div style={{ marginTop: "0.5rem" }}>
          <input
            type="range" min={0} max={100} step={0.5}
            value={audio.progress}
            onChange={e => audio.seek(e.target.value)}
            style={{
              width: "100%", height: 3,
              accentColor: color,
              cursor: "pointer",
            }}
          />
        </div>
      )}
    </div>
  );
};