import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import { SERIF } from "../components/shared/constants";

// ── Types ─────────────────────────────────────────────────────────────────────
interface WishData {
  to: string;
  from: string;
  msg: string;
  relationship?: string;
  photo: string | null;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const decodeWish = (encoded: string): WishData | null => {
  try {
    return JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch { return null; }
};

const formatDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  } catch { return ""; }
};

// Split message into paragraphs
const toParagraphs = (text: string): string[] =>
  text.split(/\n{2,}/).map(p => p.replace(/\n/g, " ").trim()).filter(Boolean);

// ── Confetti particle ─────────────────────────────────────────────────────────
interface ConfettiPiece {
  id: number; x: number; color: string;
  size: number; delay: number; duration: number; shape: "circle" | "rect" | "star";
}

const CONFETTI_COLORS = [
  "#F59E0B","#FBBF24","#FCD34D","#FDE68A",
  "#F472B6","#EC4899","#A78BFA","#60A5FA",
  "#34D399","#F87171",
];

function makeConfetti(n = 60): ConfettiPiece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    shape: (["circle","rect","star"] as const)[i % 3],
  }));
}

const Confetti: React.FC<{ active: boolean }> = ({ active }) => {
  const pieces = useRef(makeConfetti()).current;
  if (!active) return null;
  return (
    <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 999, overflow: "hidden" }}>
      {pieces.map(p => (
        <Box key={p.id} sx={{
          position: "absolute",
          left: `${p.x}%`,
          top: "-20px",
          width:  p.shape === "rect" ? p.size * 0.5 : p.size,
          height: p.shape === "rect" ? p.size * 2   : p.size,
          bgcolor: p.shape === "star" ? "transparent" : p.color,
          borderRadius: p.shape === "circle" ? "50%" : "2px",
          color: p.color,
          fontSize: p.size,
          lineHeight: 1,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in forwards`,
          "@keyframes confettiFall": {
            "0%":   { transform: "translateY(-20px) rotate(0deg)",   opacity: 1 },
            "100%": { transform: `translateY(100vh) rotate(${360 + Math.random()*360}deg)`, opacity: 0 },
          },
        }}>
          {p.shape === "star" ? "✦" : ""}
        </Box>
      ))}
    </Box>
  );
};

// ── Floating candles animation ────────────────────────────────────────────────
const FloatingCandles: React.FC = () => (
  <Box sx={{
    position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden",
  }}>
    {Array.from({ length: 8 }, (_, i) => (
      <Box key={i} sx={{
        position: "absolute",
        left: `${8 + i * 12}%`,
        bottom: 0,
        fontSize: `${1.2 + (i % 3) * 0.4}rem`,
        animation: `floatCandle ${3 + (i % 3)}s ${i * 0.4}s ease-in-out infinite alternate`,
        "@keyframes floatCandle": {
          "0%":   { transform: "translateY(0) rotate(-5deg)", opacity: 0.6 },
          "100%": { transform: "translateY(-30px) rotate(5deg)", opacity: 1 },
        },
      }}>🕯</Box>
    ))}
  </Box>
);

// ── Reveal wrapper ─────────────────────────────────────────────────────────────
const Reveal: React.FC<{ children: React.ReactNode; delay?: number }> = ({ children, delay = 0 }) => (
  <Box sx={{
    animation: `revealUp 0.7s ${delay}s cubic-bezier(0.16,1,0.3,1) both`,
    "@keyframes revealUp": {
      "0%":   { opacity: 0, transform: "translateY(28px)" },
      "100%": { opacity: 1, transform: "translateY(0)" },
    },
  }}>
    {children}
  </Box>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const WishView: React.FC = () => {
  const { search }   = useLocation();
  const [wish, setWish]         = useState<WishData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [opened, setOpened]     = useState(false);

  useEffect(() => {
    const params  = new URLSearchParams(search);
    const encoded = params.get("d");
    if (!encoded) { setError(true); setLoading(false); return; }
    const decoded = decodeWish(encoded);
    if (!decoded) { setError(true); setLoading(false); return; }
    setWish(decoded);
    setLoading(false);
    // Trigger confetti after a small delay
    setTimeout(() => setConfetti(true), 600);
    setTimeout(() => setConfetti(false), 5000);
    setTimeout(() => setOpened(true), 200);
  }, [search]);

  if (loading) return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center"
      sx={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
      <Box textAlign="center">
        <Typography sx={{ fontSize: "3rem", mb: 2, animation: "pulse 1s ease-in-out infinite", "@keyframes pulse": { "0%,100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.15)" } } }}>
          🎂
        </Typography>
        <CircularProgress sx={{ color: "#F59E0B" }} size={28} />
      </Box>
    </Box>
  );

  if (error || !wish) return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center"
      sx={{ background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)" }} px={3}>
      <Box textAlign="center" maxWidth={360}>
        <Typography sx={{ fontSize: "3rem", mb: 1 }}>🔒</Typography>
        <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "1.4rem", color: "#fff", mb: 1 }}>
          This link is invalid
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
          The birthday wish link you followed doesn't exist or has expired.
        </Typography>
        <Button href="/" variant="contained" sx={{
          mt: 3, bgcolor: "#F59E0B", color: "#1a1a1a", fontFamily: SERIF,
          fontWeight: 700, textTransform: "none", borderRadius: "10px", px: 3,
          "&:hover": { bgcolor: "#FBBF24" },
        }}>
          Go to homepage
        </Button>
      </Box>
    </Box>
  );

  const paragraphs = toParagraphs(wish.msg);
  const initials   = wish.to.charAt(0).toUpperCase();

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <Confetti active={confetti} />

      {/* ── Ambient glow blobs ── */}
      <Box sx={{
        position: "fixed", top: "-10%", left: "-10%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <Box sx={{
        position: "fixed", bottom: "-10%", right: "-5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 680, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 5, md: 8 } }}>

        {/* ── Private badge ── */}
        <Reveal delay={0}>
          <Box display="flex" justifyContent="center" mb={4}>
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: 0.8,
              bgcolor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: "100px", px: 2.5, py: 0.8,
              backdropFilter: "blur(12px)",
            }}>
              <Typography sx={{ fontSize: "0.8rem" }}>🔒</Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.73rem", fontWeight: 700, color: "#FDE68A", letterSpacing: "0.05em" }}>
                PRIVATE BIRTHDAY WISH · JUST FOR YOU
              </Typography>
            </Box>
          </Box>
        </Reveal>

        {/* ══════════════════════════════════════════════
            HERO BANNER
        ══════════════════════════════════════════════ */}
        <Reveal delay={0.1}>
          <Box sx={{
            borderRadius: "28px", overflow: "hidden",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.2)",
            mb: 4, position: "relative",
          }}>
            {/* Dark banner bg */}
            <Box sx={{
              background: "linear-gradient(135deg, #1a1207 0%, #2d1f00 40%, #3d2a00 100%)",
              px: { xs: 3, sm: 5 }, pt: { xs: 5, sm: 7 }, pb: { xs: 4, sm: 5 },
              position: "relative", overflow: "hidden",
            }}>
              {/* Gold shimmer line top */}
              <Box sx={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "linear-gradient(90deg, transparent, #F59E0B, #FCD34D, #F59E0B, transparent)",
                animation: "shimmer 3s ease-in-out infinite",
                "@keyframes shimmer": {
                  "0%,100%": { opacity: 0.6 },
                  "50%":     { opacity: 1 },
                },
              }} />

              <FloatingCandles />

              {/* Photo */}
              <Box display="flex" flexDirection="column" alignItems="center" mb={3} sx={{ position: "relative", zIndex: 2 }}>
                <Box sx={{
                  width: { xs: 100, sm: 130 }, height: { xs: 100, sm: 130 },
                  borderRadius: "50%", overflow: "hidden",
                  border: "4px solid #F59E0B",
                  boxShadow: "0 0 0 8px rgba(245,158,11,0.15), 0 20px 40px rgba(0,0,0,0.4)",
                  bgcolor: "#2d1f00",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  animation: opened ? "photoReveal 0.8s 0.3s cubic-bezier(0.34,1.56,0.64,1) both" : "none",
                  "@keyframes photoReveal": {
                    "0%":   { transform: "scale(0.5) rotate(-10deg)", opacity: 0 },
                    "100%": { transform: "scale(1)   rotate(0deg)",   opacity: 1 },
                  },
                }}>
                  {wish.photo ? (
                    <Box component="img" src={wish.photo} alt={wish.to}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Typography sx={{
                      fontFamily: SERIF, fontWeight: 900, color: "#F59E0B",
                      fontSize: { xs: "2.5rem", sm: "3rem" },
                    }}>
                      {initials}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Issue label */}
              <Box display="flex" justifyContent="center" mb={1.5} sx={{ position: "relative", zIndex: 2 }}>
                <Typography sx={{
                  fontFamily: SERIF, fontSize: "0.68rem", fontWeight: 700,
                  color: "#F59E0B", letterSpacing: "0.2em", textTransform: "uppercase",
                }}>
                  ✦ &nbsp; A BIRTHDAY TRIBUTE &nbsp; ✦
                </Typography>
              </Box>

              {/* Main headline */}
              <Typography sx={{
                fontFamily: SERIF, fontWeight: 900, textAlign: "center",
                fontSize: { xs: "2rem", sm: "2.8rem", md: "3.2rem" },
                color: "#FFFFFF",
                lineHeight: 1.15,
                textShadow: "0 4px 32px rgba(245,158,11,0.3)",
                mb: 1.5, position: "relative", zIndex: 2,
              }}>
                Happy Birthday,<br />
                <Box component="span" sx={{
                  background: "linear-gradient(135deg, #F59E0B 0%, #FCD34D 50%, #F59E0B 100%)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {wish.to}
                </Box>
                {" "}🎂
              </Typography>

              {/* Byline */}
              <Box display="flex" justifyContent="center" alignItems="center" gap={1.5} sx={{ position: "relative", zIndex: 2 }}>
                <Box sx={{ height: "1px", width: 40, bgcolor: "rgba(245,158,11,0.4)" }} />
                <Typography sx={{
                  fontFamily: SERIF, fontSize: "0.78rem",
                  color: "rgba(255,255,255,0.45)", fontStyle: "italic",
                }}>
                  A private wish from{" "}
                  <Box component="span" sx={{ color: "#FDE68A", fontStyle: "normal", fontWeight: 700 }}>
                    {wish.from}
                  </Box>
                  {wish.relationship && (
                    <Box component="span" sx={{ color: "rgba(255,255,255,0.3)" }}>
                      {" "}· your {wish.relationship}
                    </Box>
                  )}
                </Typography>
                <Box sx={{ height: "1px", width: 40, bgcolor: "rgba(245,158,11,0.4)" }} />
              </Box>

              {/* Date */}
              <Box display="flex" justifyContent="center" mt={1} sx={{ position: "relative", zIndex: 2 }}>
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>
                  {formatDate(wish.createdAt).toUpperCase()}
                </Typography>
              </Box>

              {/* Bottom shimmer line */}
              <Box sx={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 2,
                background: "linear-gradient(90deg, transparent, #F59E0B44, transparent)",
              }} />
            </Box>
          </Box>
        </Reveal>

        {/* ══════════════════════════════════════════════
            ARTICLE BODY
        ══════════════════════════════════════════════ */}
        <Reveal delay={0.3}>
          <Box sx={{
            bgcolor: "rgba(255,255,255,0.04)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "24px",
            px: { xs: 3, sm: 5 }, py: { xs: 4, sm: 5 },
            mb: 3, position: "relative", overflow: "hidden",
          }}>
            {/* Subtle top-left gold accent */}
            <Box sx={{
              position: "absolute", top: 0, left: 0,
              width: 80, height: 80,
              background: "radial-gradient(circle at top left, rgba(245,158,11,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Opening quote mark */}
            <Typography sx={{
              fontFamily: SERIF, fontSize: "6rem", lineHeight: 0.7,
              color: "rgba(245,158,11,0.2)", fontWeight: 900,
              mb: 1, display: "block", userSelect: "none",
            }}>
              "
            </Typography>

            {/* Article paragraphs */}
            {paragraphs.map((para, i) => (
              <Typography key={i} sx={{
                fontFamily: SERIF,
                fontSize: { xs: "1.05rem", sm: "1.15rem" },
                color: "rgba(255,255,255,0.88)",
                lineHeight: 1.9,
                mb: i < paragraphs.length - 1 ? 2.5 : 0,
                // Drop cap on first paragraph
                ...(i === 0 ? {
                  "&::first-letter": {
                    fontFamily: SERIF,
                    fontSize: "3.8em",
                    fontWeight: 900,
                    float: "left",
                    lineHeight: 0.75,
                    mr: "0.08em",
                    mt: "0.1em",
                    color: "#F59E0B",
                  },
                } : {}),
              }}>
                {para}
              </Typography>
            ))}

            {/* Closing ornament */}
            <Box display="flex" alignItems="center" gap={2} mt={3.5}>
              <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(245,158,11,0.2)" }} />
              <Typography sx={{ color: "#F59E0B", fontSize: "1rem", opacity: 0.6 }}>✦</Typography>
              <Box sx={{ flex: 1, height: "1px", bgcolor: "rgba(245,158,11,0.2)" }} />
            </Box>
          </Box>
        </Reveal>

        {/* ══════════════════════════════════════════════
            FROM CARD
        ══════════════════════════════════════════════ */}
        <Reveal delay={0.45}>
          <Box sx={{
            display: "flex", alignItems: "center", gap: 2.5,
            bgcolor: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.2)",
            borderRadius: "18px", px: 3, py: 2.5, mb: 3,
          }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(245,158,11,0.35)",
            }}>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "1.3rem", color: "#1a1207" }}>
                {wish.from.charAt(0).toUpperCase()}
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem", fontWeight: 700, color: "#F59E0B", letterSpacing: "0.12em", mb: 0.3 }}>
                WITH LOVE FROM
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: "1.05rem", color: "#FFFFFF" }}>
                {wish.from}
              </Typography>
              {wish.relationship && (
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", mt: 0.2, fontStyle: "italic" }}>
                  Your {wish.relationship}
                </Typography>
              )}
            </Box>
            <Box sx={{ ml: "auto", fontSize: "1.8rem" }}>🎁</Box>
          </Box>
        </Reveal>

        {/* ══════════════════════════════════════════════
            PRIVACY NOTE
        ══════════════════════════════════════════════ */}
        <Reveal delay={0.55}>
          <Box sx={{
            display: "flex", alignItems: "flex-start", gap: 1.5,
            bgcolor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "14px", px: 2.5, py: 1.8, mb: 4,
          }}>
            <Typography sx={{ fontSize: "0.9rem", mt: "1px", opacity: 0.7 }}>🔒</Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.7 }}>
              This is a private birthday wish. Only people with this exact link can read it.
              It was written especially for <strong style={{ color: "rgba(255,255,255,0.5)" }}>{wish.to}</strong>.
            </Typography>
          </Box>
        </Reveal>

        {/* ══════════════════════════════════════════════
            CTA
        ══════════════════════════════════════════════ */}
        <Reveal delay={0.65}>
          <Box textAlign="center">
            <Button
              href="/"
              variant="contained"
              sx={{
                fontFamily: SERIF, fontWeight: 800, fontSize: "0.88rem",
                textTransform: "none", borderRadius: "100px",
                px: 4, py: 1.4,
                background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                color: "#1a1207",
                boxShadow: "0 8px 32px rgba(245,158,11,0.35)",
                transition: "all 0.2s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #FBBF24 0%, #FCD34D 100%)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 40px rgba(245,158,11,0.45)",
                },
              }}
            >
              🎂 Write your own birthday wish →
            </Button>
          </Box>
        </Reveal>

      </Box>
    </Box>
  );
};

export default WishView;