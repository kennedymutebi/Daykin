// src/components/layout/Navbar.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar, Toolbar, Box, Button, Typography, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemText,
  Divider, useMediaQuery, useTheme, Avatar, Badge,
} from "@mui/material";
import MenuIcon              from "@mui/icons-material/Menu";
import CloseIcon             from "@mui/icons-material/Close";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import HomeIcon              from "@mui/icons-material/Home";
import CakeIcon              from "@mui/icons-material/Cake";
import FavoriteIcon          from "@mui/icons-material/Favorite";
import SportsSoccerIcon      from "@mui/icons-material/SportsSoccer";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";

import { ThemeToggle } from "../shared/ThemeToggle";
import { AuthModal }   from "../shared/AuthModal";
import logo            from "../../assets/writerlog.jpg";
import userAvatar      from "../../assets/profilepic.jpg";

const NAV_LINKS = [
  { label: "Home",         path: "/",             icon: <HomeIcon fontSize="small" />              },
  { label: "Birthdays",    path: "/birthdays",    icon: <CakeIcon fontSize="small" />              },
  { label: "Love Stories", path: "/love-stories", icon: <FavoriteIcon fontSize="small" />          },
  { label: "Sports",       path: "/sports",       icon: <SportsSoccerIcon fontSize="small" />      },
  { label: "Charity",      path: "/charity",      icon: <VolunteerActivismIcon fontSize="small" /> },
];

const Navbar: React.FC = () => {
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [authOpen,        setAuthOpen]        = useState(false);
  const [authDefaultView, setAuthDefaultView] = useState<"signin" | "signup">("signin");

  const navigate = useNavigate();
  const location = useLocation();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const bg          = theme.palette.background.default;
  const paper       = theme.palette.background.paper;
  const gold        = theme.palette.gold.main;           // #F5A623
  const textPrimary = theme.palette.text.primary;
  const isDark      = theme.palette.mode === "dark";

  // ── FIX 1: solid opaque bg in dark mode so nothing bleeds through ──────────
  // Dark:  fully opaque #1A1A2E — no more washed-out transparency
  // Light: slight transparency still looks good with blur
  const navBg = isDark ? bg : `${bg}F2`;

  // ── FIX 2: readable muted text ─────────────────────────────────────────────
  // Dark:  #C8C8D0 — noticeably brighter than the old #9E9E9E on navy
  // Light: keep the theme secondary (#6B6B6B) which is already fine
  const textMuted = isDark ? "#C8C8D0" : theme.palette.text.secondary;

  // ── FIX 3: visible dividers ────────────────────────────────────────────────
  const dividerColor = isDark
    ? "rgba(255,255,255,0.12)"   // was 0.07 — doubled for visibility
    : "rgba(0,0,0,0.08)";

  // ── FIX 4: Sign in button border ──────────────────────────────────────────
  // Dark:  0.45 opacity — was 0.25, barely visible on navy
  const signinBorderColor = isDark
    ? "rgba(255,255,255,0.45)"
    : "rgba(0,0,0,0.2)";

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const openAuth = (view: "signin" | "signup") => {
    setAuthDefaultView(view);
    setAuthOpen(true);
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          // only blur in light mode — in dark it adds haze without benefit
          backdropFilter: isDark ? "none" : "blur(12px)",
          borderBottom: `1px solid ${dividerColor}`,
          backgroundColor: navBg,
        }}
      >
        <Toolbar
          sx={{
            justifyContent: "space-between",
            px: { xs: 2, sm: 3, md: 4, lg: 6 },
            minHeight: { xs: 56, md: 64 },
          }}
        >
          {/* ── Logo ── */}
          <Box
            display="flex" alignItems="center" gap={1}
            onClick={() => handleNav("/")}
            sx={{ cursor: "pointer", flexShrink: 0 }}
          >
            <Box
              component="img" src={logo} alt="Daykin logo"
              sx={{
                width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 },
                borderRadius: 1.5, objectFit: "cover",
              }}
            />
            <Typography
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 900,
                fontSize: { xs: "1rem", md: "1.15rem" },
                lineHeight: 1, letterSpacing: "-0.5px",
              }}
            >
              <Box component="span" sx={{ color: gold }}>Day</Box>
              <Box component="span" sx={{ color: textPrimary }}>kin</Box>
            </Typography>
          </Box>

          {/* ── Desktop Nav links ── */}
          {!isMobile && (
            <Box
              display="flex" gap={0.5}
              sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
            >
              {NAV_LINKS.map(({ label, path }) => (
                <Button
                  key={label}
                  onClick={() => handleNav(path)}
                  sx={{
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: isActive(path) ? 700 : 500,
                    fontSize: { md: "0.82rem", lg: "0.9rem" },
                    // active = full white/dark, inactive = improved muted
                    color: isActive(path) ? textPrimary : textMuted,
                    textTransform: "none",
                    px: { md: 1.2, lg: 1.6 },
                    py: 0.6,
                    borderRadius: 2,
                    position: "relative",
                    transition: "color 0.2s",
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      bottom: 4, left: "50%",
                      transform: "translateX(-50%)",
                      width: isActive(path) ? "60%" : "0%",
                      height: 2,
                      borderRadius: 1,
                      bgcolor: gold,
                      transition: "width 0.25s ease",
                    },
                    "&:hover": {
                      color: textPrimary,
                      background: isDark
                        ? "rgba(255,255,255,0.07)"
                        : "rgba(0,0,0,0.04)",
                      "&::after": { width: "60%" },
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Box>
          )}

          {/* ── Right side actions ── */}
          <Box display="flex" gap={{ xs: 0.5, md: 1 }} alignItems="center">

            <ThemeToggle />

            {!isMobile && (
              <Button
                variant="outlined" size="small"
                onClick={() => openAuth("signin")}
                sx={{
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 600, fontSize: "0.82rem",
                  // improved border opacity in dark mode
                  borderColor: signinBorderColor,
                  color: textMuted,
                  textTransform: "none", px: 2, borderRadius: 2,
                  "&:hover": {
                    borderColor: textPrimary,
                    color: textPrimary,
                    bgcolor: isDark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                Sign in
              </Button>
            )}

            <Button
              variant="contained" size="small"
              onClick={() => openAuth("signup")}
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 700,
                fontSize: { xs: "0.75rem", md: "0.82rem" },
                textTransform: "none",
                px: { xs: 1.6, md: 2.2 },
                py: { xs: 0.5, md: 0.65 },
                borderRadius: 2,
                backgroundColor: gold,
                color: "#0D0D0D",
                // stronger shadow in dark so gold pops on navy
                boxShadow: isDark
                  ? "0 2px 12px rgba(245,166,35,0.35)"
                  : "none",
                "&:hover": {
                  backgroundColor: "#D4891A",
                  boxShadow: isDark
                    ? "0 4px 18px rgba(245,166,35,0.50)"
                    : "none",
                },
              }}
            >
              Join free
            </Button>

            <IconButton
              size="small"
              sx={{
                display: { xs: "none", sm: "flex" },
                // use textMuted which is now brighter in dark mode
                color: textMuted,
                "&:hover": {
                  color: textPrimary,
                  bgcolor: isDark
                    ? "rgba(255,255,255,0.07)"
                    : "rgba(0,0,0,0.05)",
                },
              }}
            >
              <Badge color="warning" variant="dot">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>

            <Avatar
              src={userAvatar} alt="User"
              sx={{
                width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 },
                cursor: "pointer",
                border: `2px solid ${gold}`,
                transition: "transform 0.2s",
                // subtle glow on avatar in dark mode
                boxShadow: isDark
                  ? "0 0 0 3px rgba(245,166,35,0.18)"
                  : "none",
                "&:hover": { transform: "scale(1.08)" },
              }}
            />

            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)} size="small"
                sx={{
                  color: textMuted, ml: 0.5,
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255,255,255,0.07)"
                      : "rgba(0,0,0,0.05)",
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: "80vw", sm: 300 },
            // FIX: use paper color directly, no alpha — crisp in dark mode
            bgcolor: isDark ? "#2A2A3E" : paper,
            color: textPrimary,
            borderLeft: `1px solid ${dividerColor}`,
          },
        }}
      >
        {/* Drawer header */}
        <Box
          display="flex" alignItems="center" justifyContent="space-between"
          px={2.5} pt={2} pb={1.5}
        >
          <Box
            display="flex" alignItems="center" gap={1}
            onClick={() => handleNav("/")}
            sx={{ cursor: "pointer" }}
          >
            <Box
              component="img" src={logo} alt="Daykin"
              sx={{ width: 28, height: 28, borderRadius: 1, objectFit: "cover" }}
            />
            <Typography
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 900, fontSize: "1rem",
              }}
            >
              <Box component="span" sx={{ color: gold }}>Day</Box>
              <Box component="span" sx={{ color: textPrimary }}>kin</Box>
            </Typography>
          </Box>
          <IconButton
            onClick={() => setMobileOpen(false)} size="small"
            sx={{ color: textMuted, "&:hover": { color: textPrimary } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: dividerColor, mx: 2 }} />

        {/* User row */}
        <Box display="flex" alignItems="center" gap={1.5} px={2.5} py={2}>
          <Avatar
            src={userAvatar}
            sx={{
              width: 42, height: 42,
              border: `2px solid ${gold}`,
              boxShadow: isDark ? "0 0 0 3px rgba(245,166,35,0.18)" : "none",
            }}
          />
          <Box>
            <Typography
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 700, fontSize: "0.9rem",
                color: textPrimary,
              }}
            >
              Welcome back!
            </Typography>
            <Typography
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontSize: "0.72rem",
                // FIX: brighter secondary in dark drawer
                color: textMuted,
              }}
            >
              Member since 2024
            </Typography>
          </Box>
          <Box ml="auto">
            <IconButton size="small" sx={{ color: textMuted }}>
              <Badge color="warning" variant="dot">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ borderColor: dividerColor, mx: 2, mb: 1 }} />

        {/* Nav links */}
        <List disablePadding sx={{ px: 1 }}>
          {NAV_LINKS.map(({ label, path, icon }) => (
            <ListItem key={label} disablePadding>
              <ListItemButton
                onClick={() => handleNav(path)}
                sx={{
                  borderRadius: 2, px: 2, py: 1.1, mb: 0.3,
                  bgcolor: isActive(path) ? `${gold}22` : "transparent",
                  borderLeft: "3px solid",
                  borderColor: isActive(path) ? gold : "transparent",
                  "&:hover": {
                    bgcolor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Box
                  sx={{
                    color: isActive(path) ? gold : textMuted,
                    display: "flex", mr: 1.5,
                  }}
                >
                  {icon}
                </Box>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: isActive(path) ? 700 : 500,
                    fontSize: "0.95rem",
                    color: isActive(path) ? textPrimary : textMuted,
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ borderColor: dividerColor, mx: 2, mt: 1, mb: 2 }} />

        {/* Mobile CTA buttons */}
        <Box px={2.5} display="flex" flexDirection="column" gap={1.5}>
          <Button
            variant="outlined" fullWidth
            onClick={() => { setMobileOpen(false); openAuth("signin"); }}
            sx={{
              fontFamily: theme.typography.fontFamily,
              fontWeight: 600, textTransform: "none",
              borderColor: signinBorderColor,
              color: textMuted, borderRadius: 2,
              "&:hover": { borderColor: textPrimary, color: textPrimary },
            }}
          >
            Sign in
          </Button>
          <Button
            variant="contained" fullWidth
            onClick={() => { setMobileOpen(false); openAuth("signup"); }}
            sx={{
              fontFamily: theme.typography.fontFamily,
              fontWeight: 700, textTransform: "none", borderRadius: 2,
              backgroundColor: gold,
              color: "#0D0D0D",
              boxShadow: isDark ? "0 2px 12px rgba(245,166,35,0.35)" : "none",
              "&:hover": {
                backgroundColor: "#D4891A",
                boxShadow: isDark ? "0 4px 18px rgba(245,166,35,0.50)" : "none",
              },
            }}
          >
            Join free
          </Button>

          <Box display="flex" justifyContent="center" mt={0.5}>
            <ThemeToggle />
          </Box>
        </Box>
      </Drawer>

      {/* ── Auth Modal ── */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultView={authDefaultView}
        onSuccess={(view, data) => {
          console.log("Auth success:", view, data);
        }}
      />
    </>
  );
};

export default Navbar;