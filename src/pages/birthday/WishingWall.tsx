import React, { useState } from "react";
import {
  Box, Typography, Avatar, Chip, InputBase, Button, IconButton, useTheme,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import SentimentSatisfiedAltIcon from "@mui/icons-material/SentimentSatisfiedAlt";
import { Smile as SmileIcon } from "lucide-react";
import { wishPosts } from "./birthdayMockData";
import { reactionIconMap } from "./reactionIcons";

const WishingWall: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold = theme.palette.gold.main;
  const paper = theme.palette.background.paper;
  const textMuted = theme.palette.text.secondary;

  const [draft, setDraft] = useState("");

  return (
    <Box display="flex" flexDirection="column" gap={3} sx={{ maxWidth: { md: 720 }, mx: { md: "auto" } }}>
      <Box textAlign="center">
        <Chip
          label="● LIVE WISHING WALL"
          size="small"
          sx={{ bgcolor: `${gold}22`, color: gold, fontWeight: 700, mb: 1.5 }}
        />
        <Typography sx={{ fontWeight: 800, fontSize: "1.35rem", color: theme.palette.text.primary }}>
          Celebrate with the Community
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: textMuted, mt: 0.5 }}>
          Spread joy and best wishes to everyone celebrating today. No login required, just good vibes.
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" gap={2}>
        {wishPosts.map((post) => (
          <Box
            key={post.id}
            sx={{
              bgcolor: post.highlighted ? (isDark ? "rgba(245,166,35,0.12)" : "#FBF3DE") : paper,
              borderRadius: 3,
              p: 2,
              border: post.highlighted ? `1px solid ${gold}` : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar
                  sx={{
                    width: 32, height: 32, fontSize: "0.85rem", fontWeight: 700,
                    bgcolor: gold, color: "#0D0D0D",
                  }}
                >
                  {post.author[0]}
                </Avatar>
                <Box>
                  <Box display="flex" alignItems="center" gap={0.4}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: theme.palette.text.primary }}>
                      {post.author}
                    </Typography>
                    {post.isVerified && <VerifiedIcon sx={{ fontSize: 14, color: gold }} />}
                  </Box>
                  <Typography sx={{ fontSize: "0.7rem", color: textMuted }}>{post.timeAgo}</Typography>
                </Box>
              </Box>
            </Box>

            <Typography
              sx={{
                fontStyle: "italic", fontSize: "0.85rem", mb: 1.5,
                color: post.highlighted ? gold : theme.palette.text.primary,
                fontWeight: post.highlighted ? 600 : 400,
              }}
            >
              "{post.message}"
            </Typography>

            <Box display="flex" gap={1} flexWrap="wrap">
              {post.reactions.map((r) => {
                const Icon = reactionIconMap[r.icon] ?? SmileIcon;
                return (
                  <Chip
                    key={r.icon}
                    icon={<Icon size={14} strokeWidth={2.5} />}
                    label={r.count}
                    size="small"
                    sx={{
                      bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
                      fontWeight: 600,
                      "& .MuiChip-icon": {
                        color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                        marginLeft: "8px",
                      },
                    }}
                  />
                );
              })}

              {post.tag && (
                <Chip
                  label={post.tag}
                  size="small"
                  sx={{ bgcolor: `${gold}22`, color: gold, fontWeight: 700 }}
                />
              )}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Post input */}
      <Box
        sx={{
          position: "sticky",
          bottom: { xs: 70, sm: 12 },
          display: "flex", alignItems: "center", gap: 1,
          bgcolor: paper, borderRadius: 4, p: 1,
          border: `1px solid ${gold}`,
        }}
      >
        <InputBase
          placeholder="Post a public wish..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          sx={{ flex: 1, fontSize: "0.85rem", px: 1, color: theme.palette.text.primary }}
        />
        <IconButton size="small">
          <SentimentSatisfiedAltIcon fontSize="small" sx={{ color: textMuted }} />
        </IconButton>
        <Button
          size="small"
          sx={{ bgcolor: gold, color: "#0D0D0D", fontWeight: 700, borderRadius: 2, px: 2 }}
        >
          SEND
        </Button>
      </Box>

      {/* Pro tip banner */}
      <Box sx={{ borderRadius: 3, overflow: "hidden", bgcolor: paper, border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}` }}>
        <Box sx={{ height: 120, background: isDark ? "linear-gradient(135deg, #2A2A3E, #1A1A2E)" : "linear-gradient(135deg, #D9D9E3, #C5C5D2)" }} />
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: gold, mb: 0.3 }}>PRO TIP</Typography>
          <Typography sx={{ fontSize: "0.85rem", color: theme.palette.text.primary }}>
            Use our AI Wish generator for the perfect message!
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default WishingWall;