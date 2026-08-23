// src/pages/birthday/BirthdayLayout.tsx
import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Box, Typography, IconButton, useTheme } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import DynamicFeedIcon from "@mui/icons-material/DynamicFeed";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import PsychologyIcon from "@mui/icons-material/Psychology";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";

const TABS = [
  { label: "Feed", path: "feed", icon: DynamicFeedIcon },
  { label: "Add", path: "add", icon: PersonAddAlt1Icon },
  { label: "AI Wish", path: "ai-wish", icon: PsychologyIcon },
  { label: "Celeb", path: "celeb", icon: StarBorderIcon },
  { label: "Wall", path: "wall", icon: ChatBubbleOutlineIcon },
];

const BirthdayLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme.palette.mode === "dark";
  const gold = theme.palette.gold.main;

  const activeTab = TABS.find((t) => location.pathname.includes(t.path))?.path ?? "feed";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.palette.background.default,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* App shell: narrow "phone" on mobile, wide dashboard-style panel on tablet/desktop */}
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 640, md: 900, lg: 1100, xl: 1280 },
          minHeight: "100vh",
          bgcolor: theme.palette.background.default,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          boxShadow: { md: `0 0 40px ${isDark ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.08)"}` },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2.5, md: 4, lg: 5 },
            py: { xs: 2, md: 2.5 },
            position: "sticky",
            top: 0,
            zIndex: 5,
            bgcolor: theme.palette.background.default,
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Box
              component="img"
              src="/dist/769.jpg"
              alt="Birthday"
              sx={{
                width: { xs: 28, md: 32 },
                height: { xs: 28, md: 32 },
                objectFit: "contain",
                borderRadius: "50%",
              }}
            />
            <Typography
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 800,
                fontSize: { xs: "1.3rem", md: "1.5rem" },
                color: gold,
              }}
            >
              You're Not Forgotten
            </Typography>
          </Box>

          {/* Tabs move into the header on tablet/desktop, freeing the bottom bar for mobile only */}
          <Box
            sx={{
              display: { xs: "none", sm: "flex" },
              gap: 1,
            }}
          >
            {TABS.map(({ label, path, icon: Icon }) => {
              const active = activeTab === path;
              return (
                <Box
                  key={path}
                  onClick={() => navigate(`/birthdays/${path}`)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.6,
                    px: 1.8,
                    py: 0.8,
                    borderRadius: 3,
                    cursor: "pointer",
                    bgcolor: active ? `${gold}26` : "transparent",
                    transition: "background-color 0.2s",
                    "&:hover": { bgcolor: active ? `${gold}33` : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" },
                  }}
                >
                  <Icon fontSize="small" sx={{ color: active ? gold : theme.palette.text.secondary }} />
                  <Typography
                    sx={{
                      fontFamily: theme.typography.fontFamily,
                      fontSize: "0.82rem",
                      fontWeight: active ? 700 : 500,
                      color: active ? gold : theme.palette.text.secondary,
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <IconButton size="small" sx={{ color: theme.palette.text.secondary }}>
            <NotificationsNoneIcon />
          </IconButton>
        </Box>

        {/* Page content */}
        <Box sx={{ flex: 1, px: { xs: 2.5, md: 4, lg: 5 }, pt: { xs: 2.5, md: 3.5 }, pb: { xs: 12, sm: 5 } }}>
          <Outlet />
        </Box>

        {/* Bottom tab bar — mobile only; desktop uses the header tabs above */}
        <Box
          sx={{
            display: { xs: "flex", sm: "none" },
            position: "sticky",
            bottom: 0,
            justifyContent: "space-around",
            alignItems: "center",
            px: 1,
            py: 1.2,
            bgcolor: isDark ? "rgba(42,42,62,0.96)" : "rgba(255,255,255,0.96)",
            backdropFilter: "blur(10px)",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          {TABS.map(({ label, path, icon: Icon }) => {
            const active = activeTab === path;
            return (
              <Box
                key={path}
                onClick={() => navigate(`/birthdays/${path}`)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 0.3,
                  px: 1.4,
                  py: 0.6,
                  borderRadius: 3,
                  cursor: "pointer",
                  bgcolor: active ? `${gold}26` : "transparent",
                  transition: "background-color 0.2s",
                }}
              >
                <Icon
                  fontSize="small"
                  sx={{ color: active ? gold : theme.palette.text.secondary }}
                />
                <Typography
                  sx={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: "0.68rem",
                    fontWeight: active ? 700 : 500,
                    color: active ? gold : theme.palette.text.secondary,
                  }}
                >
                  {label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};

export default BirthdayLayout;