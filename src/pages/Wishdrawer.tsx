// ── WishDrawer.tsx ─────────────────────────────────────────────────────────
// Drop-in replacement for WishModal.
// Opens as a slide-in panel from the RIGHT edge of the screen.
// Matches the dark "Craft a Magic Wish" design from the screenshot.
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from "react";
import {
  Box, Typography, Button, TextField, Switch,
  IconButton, Drawer, InputAdornment,
} from "@mui/material";
import CloseIcon        from "@mui/icons-material/Close";
import SendIcon         from "@mui/icons-material/Send";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import PhoneIcon        from "@mui/icons-material/Phone";
import MicIcon          from "@mui/icons-material/Mic";

import { FONT, RADIUS } from "./soulwishTheme";
import type { BirthdayPerson, WishEntry } from "./birthdayData";


// ── Theme tokens for the dark drawer ──────────────────────────────────────
const D = {
  bg:           "#0e0e1c",          // deepest background
  surface:      "#16162a",          // card / field surface
  surfaceHigh:  "#1e1e35",          // elevated surface
  border:       "rgba(255,255,255,0.08)",
  gold:         "#f5a623",
  goldDim:      "rgba(245,166,35,0.18)",
  text:         "#ffffff",
  textMuted:    "rgba(255,255,255,0.55)",
  textFaint:    "rgba(255,255,255,0.28)",
  success:      "#4ade80",
  error:        "#f87171",
  inputBg:      "rgba(255,255,255,0.05)",
  inputBorder:  "rgba(255,255,255,0.12)",
};

// ── Shared field style ─────────────────────────────────────────────────────
const drawerFieldSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: FONT,
    fontSize: "0.9rem",
    color: D.text,
    backgroundColor: D.inputBg,
    borderRadius: `${RADIUS.md}px`,
    "& fieldset": { borderColor: D.inputBorder },
    "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
    "&.Mui-focused fieldset": { borderColor: D.gold, borderWidth: "1.5px" },
  },
  "& .MuiInputBase-input::placeholder": {
    color: D.textFaint,
    opacity: 1,
  },
  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
    color: D.textFaint,
    fontSize: 18,
  },
};

const labelSx = {
  fontFamily: FONT,
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  color: D.textMuted,
  mb: 0.7,
};

// ── WishDrawer ─────────────────────────────────────────────────────────────
interface WishDrawerProps {
  open: boolean;
  person: BirthdayPerson | null;
  onClose: () => void;
  onSubmit: (wish: WishEntry) => void;
}

export const WishDrawer: React.FC<WishDrawerProps> = ({
  open,
  person,
  onClose,
  onSubmit,
}) => {
  const [recipientName, setRecipientName] = useState("");
  const [message, setMessage]             = useState("");
  const [phone, setPhone]                 = useState("");
  const [aiCall, setAiCall]               = useState(false);
  const [submitted, setSubmitted]         = useState(false);

  // Reset form when drawer closes
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setRecipientName("");
        setMessage("");
        setPhone("");
        setAiCall(false);
        setSubmitted(false);
      }, 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!person) return null;

  const canSend =
    recipientName.trim().length > 0 && message.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    onSubmit({
      id:          `wish_${Date.now()}`,
      fromName:    recipientName.trim(),
      message:     message.trim(),
      timestamp:   new Date(),
      recipientId: person.id,
    });
    setSubmitted(true);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{ keepMounted: false }}
      PaperProps={{
        sx: {
          width: { xs: "100vw", sm: 400 },
          maxWidth: 440,
          bgcolor: D.bg,
          borderLeft: `1px solid ${D.border}`,
          display: "flex",
          flexDirection: "column",
          overflowX: "hidden",
          // Slide-in transition
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important",
        },
      }}
    >
      {/* ── Hero image strip ────────────────────────────────────────── */}
      <Box
        sx={{
          position: "relative",
          height: 160,
          flexShrink: 0,
          bgcolor: D.surface,
          overflow: "hidden",
        }}
      >
        {person.photo && (
          <Box
            component="img"
            src={person.photo}
            alt={person.name}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center 15%",
              opacity: 0.55,
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}

        {/* Gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(14,14,28,0.3) 0%, rgba(14,14,28,0.85) 100%)",
          }}
        />

        {/* Close button */}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            left: 14,
            bgcolor: "rgba(0,0,0,0.45)",
            color: "rgba(255,255,255,0.75)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.65)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        {/* "NEW INTENTION" pill */}
        <Box
          sx={{
            position: "absolute",
            bottom: 14,
            left: 16,
            bgcolor: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(8px)",
            border: `1px solid rgba(255,255,255,0.18)`,
            borderRadius: "6px",
            px: 1.4,
            py: 0.4,
          }}
        >
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: "0.62rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            NEW INTENTION
          </Typography>
        </Box>
      </Box>

      {/* ── Drawer header ───────────────────────────────────────────── */}
      <Box sx={{ px: 3, pt: 2.8, pb: 1.2, flexShrink: 0 }}>
        <Typography
          sx={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: "1.35rem",
            color: D.text,
            lineHeight: 1.2,
          }}
        >
          Craft a Magic Wish
        </Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: "0.75rem", color: D.textMuted, mt: 0.4 }}>
          for {person.name} · {person.location}
        </Typography>
      </Box>

      {/* ── Scrollable form body ─────────────────────────────────────── */}
      {submitted ? (
        // ── Success state ──────────────────────────────────────────────
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            py: 6,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "rgba(74,222,128,0.12)",
              border: "1.5px solid rgba(74,222,128,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2.5,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 32, color: D.success }} />
          </Box>
          <Typography
            sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "1.2rem", color: D.text, mb: 1 }}
          >
            Wish Sent! 🎉
          </Typography>
          <Typography
            sx={{ fontFamily: FONT, fontSize: "0.85rem", color: D.textMuted, lineHeight: 1.6, mb: 3.5 }}
          >
            Your wish has been delivered to{" "}
            <span style={{ color: D.text, fontWeight: 700 }}>{person.name}</span>.
            {aiCall && " Our AI will call them in a warm, human voice."}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: "0.92rem",
              bgcolor: D.gold,
              color: "#000",
              borderRadius: `${RADIUS.md}px`,
              py: 1.4,
              textTransform: "none",
              "&:hover": { bgcolor: "#e09520" },
            }}
          >
            Done
          </Button>
        </Box>
      ) : (
        // ── Form ──────────────────────────────────────────────────────
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            pt: 1,
            pb: 3,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            // Scrollbar styling
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": { bgcolor: D.border, borderRadius: 2 },
          }}
        >
          {/* Recipient name */}
          <Box sx={{ mb: 2.2 }}>
            <Typography sx={labelSx}>RECIPIENT NAME</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Who is this magic for?"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              sx={drawerFieldSx}
            />
          </Box>

          {/* Emotional message */}
          <Box sx={{ mb: 2.2 }}>
            <Typography sx={labelSx}>EMOTIONAL MESSAGE</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Write your heartfelt wish here…"
              value={message}
              onChange={e => setMessage(e.target.value)}
              inputProps={{ maxLength: 280 }}
              sx={drawerFieldSx}
            />
            <Typography
              sx={{
                fontFamily: FONT,
                fontSize: "0.67rem",
                color: D.textFaint,
                textAlign: "right",
                mt: 0.5,
              }}
            >
              {message.length}/280
            </Typography>
          </Box>

          {/* Phone number */}
          <Box sx={{ mb: 2.4 }}>
            <Typography sx={labelSx}>RECIPIENT PHONE NUMBER</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="+1 (555) 900-0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon />
                  </InputAdornment>
                ),
              }}
              sx={drawerFieldSx}
            />
          </Box>

          {/* AI audio call toggle */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              bgcolor: D.surfaceHigh,
              border: `1px solid ${D.border}`,
              borderRadius: `${RADIUS.md}px`,
              px: 2,
              py: 1.6,
              mb: 3,
            }}
          >
            {/* Mic icon circle */}
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                bgcolor: D.goldDim,
                border: `1px solid rgba(245,166,35,0.3)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                mt: 0.2,
              }}
            >
              <MicIcon sx={{ fontSize: 18, color: D.gold }} />
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  color: D.text,
                  mb: 0.3,
                }}
              >
                Convert to AI Audio Call
              </Typography>
              <Typography sx={{ fontFamily: FONT, fontSize: "0.72rem", color: D.textMuted, lineHeight: 1.5 }}>
                Our AI will call them and read your wish in a warm, human voice.
              </Typography>
            </Box>

            <Switch
              checked={aiCall}
              onChange={e => setAiCall(e.target.checked)}
              size="small"
              sx={{
                flexShrink: 0,
                "& .MuiSwitch-switchBase.Mui-checked": { color: D.gold },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  bgcolor: D.gold,
                },
              }}
            />
          </Box>

          {/* Send button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleSend}
            disabled={!canSend}
            endIcon={<SendIcon sx={{ fontSize: "17px !important" }} />}
            sx={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: "0.95rem",
              bgcolor: D.gold,
              color: "#000",
              borderRadius: `${RADIUS.md}px`,
              py: 1.5,
              textTransform: "none",
              letterSpacing: "0.01em",
              "&:hover": { bgcolor: "#e09520" },
              "&.Mui-disabled": {
                bgcolor: "rgba(245,166,35,0.25)",
                color: "rgba(0,0,0,0.4)",
              },
            }}
          >
            Send Magical Wish
          </Button>

          {/* Footer tagline */}
          <Typography
            sx={{
              fontFamily: FONT,
              fontSize: "0.65rem",
              color: D.textFaint,
              textAlign: "center",
              mt: 2,
              letterSpacing: "0.08em",
            }}
          >
            SHARING CONNECTION THROUGH ILLUMINATION
          </Typography>
        </Box>
      )}
    </Drawer>
  );
};

export default WishDrawer;

// ── Usage: swap WishModal → WishDrawer in BirthdayPageRoot ─────────────────
//
//   import { WishDrawer } from "./WishDrawer";
//
//   <WishDrawer
//     open={!!wishTarget}
//     person={wishTarget}
//     onClose={() => setWishTarget(null)}
//     onSubmit={wish => {
//       setWishes(prev => [wish, ...prev]);
//       setSnack({ open: true, message: `🎉 Your wish was sent to ${wishTarget?.name.split(" ")[0]}!` });
//     }}
//   />