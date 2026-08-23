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

import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";

import { ThemeToggle } from "../shared/ThemeToggle";
import { AuthModal }   from "../shared/AuthModal";
import logo            from "../../assets/writerlog.jpg";
import userAvatar      from "../../assets/profilepic.jpg";


import { login, register } from "../../services/auth.service";
import { useAuth } from "../../hooks/useAuth";
import type { LoginPayload, RegisterPayload } from "../../types/api";

const NAV_LINKS = [
  { label: "Home",         path: "/",             icon: <HomeIcon fontSize="small" />              },
  { label: "Birthdays",    path: "/birthdays",    icon: <CakeIcon fontSize="small" />              },
  { label: "Compose", path: "/love-stories", icon: <FavoriteIcon fontSize="small" />          },
 // { label: "Sports",       path: "/sports",       icon: <SportsSoccerIcon fontSize="small" />      },
  { label: "Charity",      path: "/charity",      icon: <VolunteerActivismIcon fontSize="small" /> },
];

const Navbar: React.FC = () => {
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [authOpen,        setAuthOpen]        = useState(false);
  const [authDefaultView, setAuthDefaultView] = useState<"signin" | "signup">("signin");
  const [authLoading,     setAuthLoading]     = useState(false);
  const [authError,       setAuthError]       = useState<string | null>(null);
  

  const { user, refetch, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const theme    = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const bg          = theme.palette.background.default;
  const paper       = theme.palette.background.paper;
  const gold        = theme.palette.gold.main;
  const textPrimary = theme.palette.text.primary;
  const isDark      = theme.palette.mode === "dark";

  const navBg             = isDark ? bg : `${bg}F2`;
  const textMuted         = isDark ? "#C8C8D0" : theme.palette.text.secondary;
  const dividerColor      = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const signinBorderColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.2)";

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
  
  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    
  };

  // FIX: clear stale error when reopening modal
  const openAuth = (view: "signin" | "signup") => {
    setAuthDefaultView(view);
    setAuthError(null);
    setAuthOpen(true);
  };

  const handleAuthSuccess = async (
    view: "signin" | "signup",
    data: LoginPayload | RegisterPayload,
  ) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (view === "signin") {
        await login(data as LoginPayload);
      } else {
        await register(data as RegisterPayload);
        await login({
          username: (data as RegisterPayload).username,
          password: (data as RegisterPayload).password,
        });
      }
      await refetch();
      setAuthOpen(false);
      setAuthError(null);
    } catch (err) {
      // FIX: firstError pulls the real Django message e.g.
      // "No active account found with the given credentials."
      const apiErr = err as { firstError?: string; message?: string };
      setAuthError(apiErr.firstError ?? apiErr.message ?? "Something went wrong. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
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
              component="img" src={logo} alt="Ebiseera logo"
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
              <Box component="span" sx={{ color: gold }}>Ebi</Box>
              <Box component="span" sx={{ color: textPrimary }}>seera</Box>
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
                      background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
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

            {!user && !isMobile && (
              <Button
                variant="outlined" size="small"
                onClick={() => openAuth("signin")}
                sx={{
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: 600, fontSize: "0.82rem",
                  borderColor: signinBorderColor,
                  color: textMuted,
                  textTransform: "none", px: 2, borderRadius: 2,
                  "&:hover": {
                    borderColor: textPrimary, color: textPrimary,
                    bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                Sign in
              </Button>
            )}

            {!user && (
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
                  boxShadow: isDark ? "0 2px 12px rgba(245,166,35,0.35)" : "none",
                  "&:hover": {
                    backgroundColor: "#D4891A",
                    boxShadow: isDark ? "0 4px 18px rgba(245,166,35,0.50)" : "none",
                  },
                }}
              >
                Join free
              </Button>
            )}

            <IconButton
              size="small"
              sx={{
                display: { xs: "none", sm: "flex" },
                color: textMuted,
                "&:hover": {
                  color: textPrimary,
                  bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                },
              }}
            >
              <Badge color="warning" variant="dot">
                <NotificationsNoneIcon fontSize="small" />
              </Badge>
            </IconButton>

            <Avatar
              src={user ? undefined : userAvatar}
              alt={user ? user.name : "User"}
              onClick={user ? handleLogout : undefined}
              sx={{
                width: { xs: 30, md: 36 }, height: { xs: 30, md: 36 },
                cursor: user ? "pointer" : "default",
                border: `2px solid ${gold}`,
                transition: "transform 0.2s",
                boxShadow: isDark ? "0 0 0 3px rgba(245,166,35,0.18)" : "none",
                "&:hover": { transform: "scale(1.08)" },
              }}
            >
              {user && user.initials}
            </Avatar>

            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)} size="small"
                sx={{
                  color: textMuted, ml: 0.5,
                  "&:hover": {
                    bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
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
              component="img" src={logo} alt="Ebiseera"
              sx={{ width: 28, height: 28, borderRadius: 1, objectFit: "cover" }}
            />
            <Typography sx={{ fontFamily: theme.typography.fontFamily, fontWeight: 900, fontSize: "1rem" }}>
              <Box component="span" sx={{ color: gold }}>Ebi</Box>
              <Box component="span" sx={{ color: textPrimary }}>seera</Box>
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
            src={user ? undefined : userAvatar}
            sx={{
              width: 42, height: 42,
              border: `2px solid ${gold}`,
              boxShadow: isDark ? "0 0 0 3px rgba(245,166,35,0.18)" : "none",
            }}
          >
            {user && user.initials}
          </Avatar>
          <Box>
            <Typography sx={{
              fontFamily: theme.typography.fontFamily,
              fontWeight: 700, fontSize: "0.9rem", color: textPrimary,
            }}>
              {user ? user.name : "Welcome back!"}
            </Typography>
            <Typography sx={{
              fontFamily: theme.typography.fontFamily,
              fontSize: "0.72rem", color: textMuted,
            }}>
              {user ? user.email : "Member since 2024"}
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
                    bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)",
                  },
                }}
              >
                <Box sx={{ color: isActive(path) ? gold : textMuted, display: "flex", mr: 1.5 }}>
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
          {user ? (
            <Button
              variant="outlined" fullWidth onClick={handleLogout}
              sx={{
                fontFamily: theme.typography.fontFamily,
                fontWeight: 600, textTransform: "none",
                borderColor: signinBorderColor,
                color: textMuted, borderRadius: 2,
                "&:hover": { borderColor: textPrimary, color: textPrimary },
              }}
            >
              Log out
            </Button>
          ) : (
            <>
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
                  backgroundColor: gold, color: "#0D0D0D",
                  boxShadow: isDark ? "0 2px 12px rgba(245,166,35,0.35)" : "none",
                  "&:hover": {
                    backgroundColor: "#D4891A",
                    boxShadow: isDark ? "0 4px 18px rgba(245,166,35,0.50)" : "none",
                  },
                }}
              >
                Join free
              </Button>
            </>
          )}

          <Box display="flex" justifyContent="center" mt={0.5}>
            <ThemeToggle />
          </Box>
        </Box>
      </Drawer>

      {/* ── Auth Modal ── */}
      <AuthModal
        open={authOpen}
        onClose={() => { setAuthOpen(false); setAuthError(null); }}
        defaultView={authDefaultView}
        loading={authLoading}
        error={authError}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default Navbar;