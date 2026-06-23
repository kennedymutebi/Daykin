import React, { useState, useMemo } from "react";
import {
  Avatar, Box, Button, Chip, LinearProgress, Stack, Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import SchoolIcon from "@mui/icons-material/School";
import HomeIcon from "@mui/icons-material/Home";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PeopleIcon from "@mui/icons-material/People";
import VolunteerActivismIcon from "@mui/icons-material/VolunteerActivism";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import ArticleSearchBar from "../components/shared/ArticleSearchBar";

import { useAudio } from "../hooks/useAudio";
import { CHARITY_CASES, type CharityCase } from "../data/charityArticles";

const SERIF           = "'Playfair Display', Georgia, serif";


const TAG_FILTERS  = ["All", "Medical", "Education", "Shelter", "Food", "Child", "Urgent"];
const PRESET_AMOUNTS = [5, 10, 25, 50, 100, 250];

const TAG_ICONS: Record<string, React.ReactNode> = {
  Medical:   <LocalHospitalIcon sx={{ fontSize: 13 }} />,
  Education: <SchoolIcon        sx={{ fontSize: 13 }} />,
  Shelter:   <HomeIcon          sx={{ fontSize: 13 }} />,
  Food:      <RestaurantIcon    sx={{ fontSize: 13 }} />,
  Child:     <ChildCareIcon     sx={{ fontSize: 13 }} />,
  Urgent:    <WarningAmberIcon  sx={{ fontSize: 13 }} />,
};

function pct(raised: number, goal: number) {
  return Math.min(100, Math.round((raised / goal) * 100));
}
function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ── DonationModal ─────────────────────────────────────────────────────────────
const DonationModal: React.FC<{ cause: CharityCase; onClose: () => void }> = ({
  cause, onClose,
}) => {
  const theme      = useTheme();
  const isDark     = theme.palette.mode === "dark";
  const accent     = theme.palette.primary.main;
  const accentText = theme.palette.primary.contrastText;
  const accentHover = theme.palette.primary.dark ?? "#d4881a";

  const [amount, setAmount] = useState<number>(25);
  const [custom, setCustom] = useState("");
  const [step,   setStep]   = useState<"pick" | "confirm" | "done">("pick");

  const finalAmount = custom ? Number(custom) : amount;
  const progress    = pct(cause.raised, cause.goal);

  const modalBg     = isDark ? "#111" : "#1a1a1a";
  const modalBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.12)";

  return (
    <div
      onClick={e => (e.target as HTMLElement).dataset.overlay && onClose()}
      data-overlay="true"
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 400, display: "flex",
        alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div style={{
        background: modalBg,
        border: `1px solid ${modalBorder}`,
        maxWidth: 520, width: "100%",
        padding: "2.5rem 2rem",
        position: "relative",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: "absolute", top: "1rem", right: "1rem",
          background: "none", border: "none", cursor: "pointer",
          color: "rgba(255,255,255,0.4)", display: "flex",
        }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </button>

        {step === "done" ? (
          <Box textAlign="center" py={3}>
            <CheckCircleIcon sx={{ fontSize: 56, color: "#10B981", mb: 2 }} />
            <Typography sx={{ fontFamily: SERIF, fontSize: "1.5rem",
              fontWeight: 700, color: "#fff", mb: 1 }}>
              Thank you so much!
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.95rem",
              color: "rgba(255,255,255,0.5)", mb: 2 }}>
              Your {fmt(finalAmount)} donation to {cause.beneficiary} has been received.
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.85rem",
              color: "rgba(255,255,255,0.3)", mb: 3 }}>
              You will receive a confirmation email shortly. Every contribution brings us closer to the goal.
            </Typography>
            <Button onClick={onClose} variant="contained"
              sx={{
                bgcolor: accent, color: accentText,
                fontFamily: SERIF, textTransform: "none",
                "&:hover": { bgcolor: accentHover },
              }}>
              Close
            </Button>
          </Box>
        ) : (
          <>
            {/* Hero image strip */}
            <Box sx={{ mx: -4, mt: -4, mb: 2.5, height: 160, overflow: "hidden" }}
              style={{ margin: "-2.5rem -2rem 1.5rem" }}>
              <img src={cause.img} alt={cause.title}
                style={{ width: "100%", height: "100%", objectFit: "cover",
                  display: "block", opacity: 0.75 }} />
            </Box>

            {/* Urgent badge */}
            {cause.urgent && (
              <Stack direction="row" alignItems="center" spacing={0.6} mb={1}>
                <WarningAmberIcon sx={{ fontSize: 13, color: "#F59E0B" }} />
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem",
                  letterSpacing: "0.08em", color: "#F59E0B", textTransform: "uppercase" }}>
                  Urgent — Time Sensitive
                </Typography>
              </Stack>
            )}

            <Typography sx={{ fontFamily: SERIF, fontSize: "1.2rem", fontWeight: 700,
              color: "#fff", lineHeight: 1.3, mb: 0.5 }}>
              {cause.title}
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem",
              color: "rgba(255,255,255,0.4)", mb: 2 }}>
              {cause.beneficiary} · {cause.location}
            </Typography>

            {/* Progress */}
            <Box mb={2.5}>
              <LinearProgress variant="determinate" value={progress} sx={{
                height: 6, borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.08)",
                "& .MuiLinearProgress-bar": { bgcolor: accent, borderRadius: 3 },
                mb: 1,
              }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem",
                  color: "#fff", fontWeight: 700 }}>
                  {fmt(cause.raised)} raised
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem",
                  color: "rgba(255,255,255,0.35)" }}>
                  {fmt(cause.goal)} goal · {cause.donors} donors
                </Typography>
              </Stack>
            </Box>

            {step === "pick" && (
              <>
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.4)", mb: 1.5,
                  letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Choose an amount
                </Typography>

                {/* Preset buttons */}
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mb: 1.5 }}>
                  {PRESET_AMOUNTS.map(a => (
                    <button key={a} onClick={() => { setAmount(a); setCustom(""); }}
                      style={{
                        padding: "0.65rem",
                        background: amount === a && !custom ? accent : "rgba(255,255,255,0.05)",
                        border: `1px solid ${amount === a && !custom ? accent : "rgba(255,255,255,0.12)"}`,
                        color: amount === a && !custom ? accentText : "#fff",
                        fontFamily: SERIF, fontSize: "0.9rem",
                        cursor: "pointer", transition: "all 0.18s",
                      }}>
                      ${a}
                    </button>
                  ))}
                </Box>

                {/* Custom input */}
                <Box sx={{ position: "relative", mb: 2 }}>
                  <Typography sx={{ position: "absolute", left: 12, top: "50%",
                    transform: "translateY(-50%)", fontFamily: SERIF,
                    color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>$</Typography>
                  <input
                    type="number" placeholder="Custom amount" value={custom}
                    onChange={e => setCustom(e.target.value)}
                    style={{
                      width: "100%", padding: "0.7rem 0.8rem 0.7rem 1.6rem",
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${custom ? accent : "rgba(255,255,255,0.12)"}`,
                      color: "#fff", fontFamily: SERIF, fontSize: "0.9rem",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                </Box>

                <Button fullWidth variant="contained"
                  disabled={!finalAmount || finalAmount <= 0}
                  onClick={() => setStep("confirm")}
                  sx={{
                    bgcolor: accent, color: accentText,
                    fontFamily: SERIF, fontSize: "0.95rem",
                    textTransform: "none", py: 1.4, fontWeight: 700,
                    "&:hover": { bgcolor: accentHover },
                    "&.Mui-disabled": {
                      bgcolor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.2)",
                    },
                  }}>
                  Donate {finalAmount > 0 ? fmt(finalAmount) : ""} →
                </Button>

                <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem",
                  color: "rgba(255,255,255,0.2)", textAlign: "center", mt: 1.5 }}>
                  100% goes directly to the beneficiary. Powered by Stripe.
                </Typography>
              </>
            )}

            {step === "confirm" && (
              <>
                <Box sx={{
                  background: `${accent}18`,
                  border: `1px solid ${accent}44`,
                  p: 2, mb: 2,
                }}>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.5)", mb: 0.5 }}>You are donating</Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "2rem",
                    fontWeight: 800, color: "#fff" }}>{fmt(finalAmount)}</Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.4)" }}>to {cause.beneficiary}</Typography>
                </Box>

                <Stack spacing={1.5} mb={2}>
                  {["Card Number", "Name on Card", "Expiry / CVV"].map(label => (
                    <input key={label} placeholder={label}
                      style={{
                        width: "100%", padding: "0.7rem 0.9rem",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#fff", fontFamily: SERIF, fontSize: "0.88rem",
                        outline: "none", boxSizing: "border-box",
                      }} />
                  ))}
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Button fullWidth variant="outlined" onClick={() => setStep("pick")}
                    sx={{
                      fontFamily: SERIF, textTransform: "none",
                      borderColor: "rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.5)",
                      "&:hover": { borderColor: "rgba(255,255,255,0.3)" },
                    }}>
                    Back
                  </Button>
                  <Button fullWidth variant="contained" onClick={() => setStep("done")}
                    sx={{
                      bgcolor: accent, color: accentText,
                      fontFamily: SERIF, textTransform: "none",
                      fontWeight: 700, "&:hover": { bgcolor: accentHover },
                    }}>
                    Confirm Donation
                  </Button>
                </Stack>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── CaseCard ──────────────────────────────────────────────────────────────────
const CaseCard: React.FC<{
  cause: CharityCase;
  onRead:   (c: CharityCase) => void;
  onDonate: (c: CharityCase) => void;
}> = ({ cause, onRead, onDonate }) => {
  const theme      = useTheme();
  const accent     = theme.palette.primary.main;
  const accentText = theme.palette.primary.contrastText;
  const accentHover = theme.palette.primary.dark ?? "#d4881a";
  const progress   = pct(cause.raised, cause.goal);
  const remaining  = cause.goal - cause.raised;

  return (
    <article style={{
      display: "flex", flexDirection: "column",
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      overflow: "hidden",
    }}>
      {/* Image */}
      <Box onClick={() => onRead(cause)} sx={{
        position: "relative", aspectRatio: "16/9",
        overflow: "hidden", cursor: "pointer",
        "&:hover img": { transform: "scale(1.04)" },
      }}>
        <img src={cause.img} alt={cause.title}
          style={{ width: "100%", height: "100%", objectFit: "cover",
            display: "block", transition: "transform 0.45s ease" }} />

        {/* Tag badge */}
        <Box sx={{
          position: "absolute", top: 10, left: 10,
          bgcolor: `${cause.categoryColor}22`, backdropFilter: "blur(6px)",
          border: `1px solid ${cause.categoryColor}44`,
          px: 1.2, py: 0.4, display: "flex", alignItems: "center", gap: 0.5,
        }}>
          <Box sx={{ color: cause.categoryColor, display: "flex", fontSize: 13 }}>
            {TAG_ICONS[cause.tag] ?? <FavoriteIcon sx={{ fontSize: 13 }} />}
          </Box>
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.65rem",
            letterSpacing: "0.06em", textTransform: "uppercase",
            color: cause.categoryColor }}>
            {cause.tag}
          </Typography>
        </Box>

        {/* Urgent badge */}
        {cause.urgent && (
          <Box sx={{
            position: "absolute", top: 10, right: 10,
            bgcolor: "rgba(245,158,11,0.18)", backdropFilter: "blur(6px)",
            border: "1px solid rgba(245,158,11,0.35)",
            px: 1, py: 0.3, display: "flex", alignItems: "center", gap: 0.4,
          }}>
            <WarningAmberIcon sx={{ fontSize: 11, color: "#F59E0B" }} />
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.62rem",
              color: "#F59E0B", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Urgent
            </Typography>
          </Box>
        )}

        {/* Donors badge */}
        <Box sx={{
          position: "absolute", bottom: 10, left: 10,
          bgcolor: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
          px: 1.2, py: 0.4, display: "flex", alignItems: "center", gap: 0.5,
          borderRadius: "20px",
        }}>
          <PeopleIcon sx={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem",
            color: "rgba(255,255,255,0.65)" }}>
            {cause.donors.toLocaleString()} donors
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box p={2} display="flex" flexDirection="column" flex={1}>
        {/* Author */}
        <Stack direction="row" alignItems="center" spacing={1} mb={1.2}>
          <Avatar sx={{ width: 28, height: 28, bgcolor: cause.authorColor,
            fontSize: "0.6rem", fontWeight: 700, fontFamily: SERIF }}>
            {cause.authorInitials}
          </Avatar>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.75rem",
              fontWeight: 700, color: theme.palette.text.primary }}>
              {cause.author}
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.65rem",
              color: theme.palette.text.disabled }}>
              {cause.date} · {cause.location}
            </Typography>
          </Box>
        </Stack>

        {/* Title */}
        <Typography onClick={() => onRead(cause)} sx={{
          fontFamily: SERIF, fontSize: { xs: "1rem", sm: "1.08rem" },
          fontWeight: 700, lineHeight: 1.3,
          color: theme.palette.text.primary,
          mb: 0.8, cursor: "pointer", transition: "color 0.18s",
          "&:hover": { color: accent },
        }}>
          {cause.title}
        </Typography>

        {/* Excerpt */}
        <Typography onClick={() => onRead(cause)} sx={{
          fontFamily: SERIF, fontSize: "0.84rem",
          color: theme.palette.text.secondary,
          lineHeight: 1.6, mb: 1.5, cursor: "pointer",
          display: "-webkit-box", WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {cause.excerpt}
        </Typography>

        {/* Progress bar */}
        <Box mb={1.5} mt="auto">
          <LinearProgress variant="determinate" value={progress} sx={{
            height: 5, borderRadius: 3,
            bgcolor: theme.palette.action.hover,
            "& .MuiLinearProgress-bar": {
              // Green when nearly funded — semantic signal, not brand color
              bgcolor: progress >= 80 ? "#10B981" : accent,
              borderRadius: 3,
            },
            mb: 0.8,
          }} />
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.82rem",
                fontWeight: 700, color: theme.palette.text.primary }}>
                {fmt(cause.raised)}
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem",
                color: theme.palette.text.disabled }}>
                raised of {fmt(cause.goal)}
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem",
              color: progress >= 80 ? "#10B981" : accent, fontWeight: 700 }}>
              {progress}%
            </Typography>
          </Stack>
        </Box>

        {/* Remaining */}
        <Typography sx={{ fontFamily: SERIF, fontSize: "0.75rem",
          color: theme.palette.text.disabled, mb: 1.5 }}>
          {fmt(remaining)} still needed
        </Typography>

        {/* CTA buttons */}
        <Stack direction="row" spacing={1}>
          <Button onClick={() => onRead(cause)} variant="outlined" size="small" fullWidth
            sx={{
              fontFamily: SERIF, textTransform: "none", fontSize: "0.78rem",
              borderColor: theme.palette.divider,
              color: theme.palette.text.secondary, py: 0.8,
              "&:hover": {
                borderColor: theme.palette.text.primary,
                color: theme.palette.text.primary,
              },
            }}>
            Read story
          </Button>
          <Button onClick={() => onDonate(cause)} variant="contained" size="small" fullWidth
            startIcon={<VolunteerActivismIcon sx={{ fontSize: "15px !important" }} />}
            sx={{
              fontFamily: SERIF, textTransform: "none", fontSize: "0.78rem",
              bgcolor: accent, color: accentText,
              py: 0.8, fontWeight: 700,
              "&:hover": { bgcolor: accentHover },
            }}>
            Donate
          </Button>
        </Stack>
      </Box>
    </article>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CharityPage() {
  const theme      = useTheme();
  const isDark     = theme.palette.mode === "dark";
  const accent     = theme.palette.primary.main;
  const accentText = theme.palette.primary.contrastText;

  const [activeCause,   setActiveCause]  = useState<CharityCase | null>(null);
  const [donateCause,  setDonateCause]  = useState<CharityCase | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery,  setSearchQuery]  = useState("");
  

  const totalRaised = CHARITY_CASES.reduce((s, c) => s + c.raised, 0);
  const totalDonors = CHARITY_CASES.reduce((s, c) => s + c.donors, 0);

  const displayed = useMemo(() => {
    let cases = [...CHARITY_CASES];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      cases = cases.filter(c =>
        c.title.toLowerCase().includes(q)       ||
        c.excerpt.toLowerCase().includes(q)     ||
        c.beneficiary.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)    ||
        c.tag.toLowerCase().includes(q)
      );
    }
    if (activeFilter === "Urgent") {
      cases = cases.filter(c => c.urgent);
    } else if (activeFilter !== "All") {
      cases = cases.filter(c => c.tag === activeFilter);
    }
    return cases;
  }, [activeFilter, searchQuery]);

  return (
    <Box sx={{ backgroundColor: theme.palette.background.default, minHeight: "100vh" }}>

      {/* ── Hero Banner ── */}
      <Box sx={{
        position: "relative", overflow: "hidden",
        px: { xs: 2, sm: 4, md: 6, lg: 10 },
        py: { xs: 5, md: 7 },
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, #0D0D0D 60%)`
          : `linear-gradient(135deg, ${accent}18 0%, #ffffff 60%)`,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        {/* Background glow */}
        <Box sx={{
          position: "absolute", top: -60, left: -60,
          width: 400, height: 400, borderRadius: "50%",
          background: `radial-gradient(circle, ${accent}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }} />

        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <VolunteerActivismIcon sx={{ color: accent, fontSize: 28 }} />
          <Typography sx={{
            fontFamily: SERIF, fontWeight: 800,
            fontSize: { xs: "1.8rem", md: "2.8rem" },
            color: theme.palette.text.primary, lineHeight: 1,
          }}>
            Change a Life Today
          </Typography>
        </Stack>

        <Typography sx={{
          fontFamily: SERIF, fontSize: { xs: "0.95rem", md: "1.1rem" },
          color: theme.palette.text.secondary,
          maxWidth: 560, lineHeight: 1.7, mb: 3,
        }}>
          Real stories. Real people. Every donation goes directly to those who need it most —
          the sick, the hungry, the displaced, the forgotten.
        </Typography>

        {/* Stats row */}
        <Stack direction="row" spacing={4} flexWrap="wrap">
          {[
            { label: "Total Raised", value: fmt(totalRaised)               },
            { label: "Active Donors", value: totalDonors.toLocaleString()  },
            { label: "Open Cases",    value: CHARITY_CASES.length.toString() },
          ].map(({ label, value }) => (
            <Box key={label}>
              <Typography sx={{
                fontFamily: SERIF, fontSize: { xs: "1.4rem", md: "1.8rem" },
                fontWeight: 800, color: theme.palette.text.primary,
              }}>
                {value}
              </Typography>
              <Typography sx={{
                fontFamily: SERIF, fontSize: "0.75rem",
                color: theme.palette.text.disabled,
                letterSpacing: "0.05em", textTransform: "uppercase",
              }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── Search ── */}
      <Box sx={{
        px: { xs: 2, sm: 4, md: 6, lg: 10 },
        pt: { xs: 3, md: 4 }, pb: 2.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}>
        <ArticleSearchBar
          placeholder="Search by name, condition, or location..."
          accentColor={accent}
          onSearch={setSearchQuery}
        />
      </Box>

      {/* ── Filter chips ── */}
      <Box sx={{ px: { xs: 2, sm: 4, md: 6, lg: 10 }, pt: 3, pb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}
          sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 2.5 }}>
          <Typography sx={{
            fontFamily: SERIF, fontSize: "0.83rem",
            color: theme.palette.text.secondary,
          }}>
            {displayed.length} case{displayed.length !== 1 ? "s" : ""} need your help
          </Typography>
          <Button endIcon={<ArrowForwardIcon />} sx={{
            fontFamily: SERIF, fontSize: "0.8rem",
            color: theme.palette.text.secondary, textTransform: "none",
            "&:hover": { color: theme.palette.text.primary },
          }}>
            See all
          </Button>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {TAG_FILTERS.map(f => {
            const active = activeFilter === f;
            return (
              <Chip key={f} label={f}
                icon={f !== "All" ? (
                  <Box sx={{
                    color: `${active ? accentText : theme.palette.text.secondary} !important`,
                    display: "flex", fontSize: "13px !important",
                  }}>
                    {TAG_ICONS[f] ?? <FavoriteIcon sx={{ fontSize: 13 }} />}
                  </Box>
                ) : undefined}
                onClick={() => setActiveFilter(f)}
                size="small"
                sx={{
                  fontFamily: SERIF, fontSize: "0.75rem", height: 28, cursor: "pointer",
                  bgcolor: active ? accent : theme.palette.action.hover,
                  color:   active ? accentText : theme.palette.text.secondary,
                  border:  `1px solid ${active ? accent : theme.palette.divider}`,
                  transition: "all 0.2s",
                  "&:hover": {
                    bgcolor: active ? accent : theme.palette.action.selected,
                    color:   active ? accentText : theme.palette.text.primary,
                  },
                  "& .MuiChip-label": { px: 1.2 },
                }}
              />
            );
          })}
        </Stack>
      </Box>

      {/* ── Case grid ── */}
      <Box sx={{ px: { xs: 2, sm: 4, md: 6, lg: 10 }, pb: { xs: 6, md: 10 }, pt: 2 }}>
        {displayed.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <VolunteerActivismIcon sx={{ fontSize: 48,
              color: theme.palette.action.disabled, mb: 2 }} />
            <Typography sx={{ fontFamily: SERIF, fontSize: "1rem",
              color: theme.palette.text.disabled }}>
              {searchQuery
                ? `No cases found for "${searchQuery}"`
                : "No cases in this category"}
            </Typography>
          </Box>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "2rem",
          }}>
            {displayed.map(cause => (
              <CaseCard key={cause.id} cause={cause}
                onRead={c   => setActiveCause(c  as CharityCase)}
                onDonate={c => setDonateCause(c as CharityCase)}
              />
            ))}
          </div>
        )}
      </Box>

      {donateCause && (
        <DonationModal cause={donateCause} onClose={() => setDonateCause(null)} />
      )}
    </Box>
  );
}