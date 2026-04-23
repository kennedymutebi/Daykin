import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { SERIF } from "./constants";
import type { Engagement } from "../../types/article";

interface Props { engagement: Engagement; color: string; }

export const EngagementBar: React.FC<Props> = ({ engagement, color }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [liked,    setLiked]    = useState(false);
  const [reposted, setReposted] = useState(false);

  // Idle icon/text color — readable in both modes
  const idle = theme.palette.text.secondary;

  const btn: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: "0.35rem",
    background: "none", border: "none", cursor: "pointer",
    fontFamily: SERIF, fontSize: "0.82rem", padding: "0.2rem 0",
    transition: "color 0.15s",
  };

  return (
    <div
      style={{
        display: "flex", alignItems: "center",
        borderTop: `1px solid ${theme.palette.divider}`,
        paddingTop: "0.7rem", marginTop: "0.6rem",
      }}
    >
      {/* Like */}
      <button
        onClick={() => setLiked(v => !v)}
        style={{ ...btn, color: liked ? color : idle, marginRight: "1rem" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill={liked ? color : "none"}
          stroke={liked ? color : "currentColor"} strokeWidth="1.8">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {engagement.likes + (liked ? 1 : 0)}
      </button>

      {/* Comment */}
      <button style={{ ...btn, color: idle, marginRight: "1rem" }}>
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {engagement.comments}
      </button>

      {/* Repost — intentionally green when active, same in both modes */}
      <button
        onClick={() => setReposted(v => !v)}
        style={{ ...btn, color: reposted ? "#22c55e" : idle }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        {engagement.reposts + (reposted ? 1 : 0)}
      </button>

      {/* Share */}
      <button style={{ ...btn, color: idle, marginLeft: "auto" }}>
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>
    </div>
  );
};