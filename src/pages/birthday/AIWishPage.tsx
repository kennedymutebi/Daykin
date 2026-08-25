// src/pages/birthday/AIWishPage.tsx
import React, { useState } from "react";
import { Box, Typography, TextField, Button, InputAdornment, useTheme } from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneIcon from "@mui/icons-material/Phone";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

const STEPS = [
  "Our advanced AI processes your custom message to craft a natural, warm phone call script.",
  "The AI calls the provided phone number within 60 seconds.",
  "The AI delivers the wish, reacts to their responses, and creates a core memory!",
];

const AIWishPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold = theme.palette.gold.main;
  const paper = theme.palette.background.paper;
  const textMuted = theme.palette.text.secondary;

  const [form, setForm] = useState({ name: "", phone: "", message: "" });
  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const labelSx = { fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.5px", color: textMuted, mb: 0.5 };
  const fieldSx = {
    "& .MuiOutlinedInput-root": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F7F7F9", borderRadius: 2 },
  };

  return (
    <Box display="flex" flexDirection="column" gap={3} sx={{ maxWidth: { md: 640 }, mx: { md: "auto" } }}>
      <Box textAlign="center">
        <Typography sx={{ fontWeight: 800, fontSize: "1.4rem", color: theme.palette.text.primary }}>
          AI Magic Wish
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: textMuted, mt: 0.5 }}>
          Surprise them with a personal call from our AI host.
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: paper,
          borderRadius: 4,
          p: 2.5,
          display: "flex",
          flexDirection: "column",
          gap: 2,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        <Box>
          <Typography sx={labelSx}>RECIPIENT NAME</Typography>
          <TextField
            fullWidth size="small" placeholder="Who is the lucky person?"
            value={form.name} onChange={handleChange("name")} sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment> }}
          />
        </Box>
        <Box>
          <Typography sx={labelSx}>PHONE NUMBER</Typography>
          <TextField
            fullWidth size="small" placeholder="+1 (555) 000-0000"
            value={form.phone} onChange={handleChange("phone")} sx={fieldSx}
            InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }}
          />
        </Box>
        <Box>
          <Typography sx={labelSx}>PERSONAL MESSAGE</Typography>
          <TextField
            fullWidth size="small" multiline minRows={3}
            placeholder="What should the AI say? (e.g., Happy 30th Birthday, Sarah! Hope you have a day full of coffee and joy.)"
            value={form.message} onChange={handleChange("message")} sx={fieldSx}
          />
        </Box>

        <Button
          fullWidth
          startIcon={<AutoAwesomeIcon />}
          sx={{
            background: "linear-gradient(90deg, #B8860B, #F5A623)",
            color: "#0D0D0D", fontWeight: 800, borderRadius: 2, py: 1.3, letterSpacing: "0.5px",
          }}
        >
          AI MAGIC CALL
        </Button>
      </Box>

      {/* How it works */}
      <Box
        sx={{
          bgcolor: paper,
          borderRadius: 3,
          p: 2.2,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1} mb={1.5}>
          <InfoOutlinedIcon sx={{ color: gold }} fontSize="small" />
          <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary }}>How the Magic Happens</Typography>
        </Box>
        <Box display="flex" flexDirection="column" gap={1.5}>
          {STEPS.map((step, i) => (
            <Box key={i} display="flex" gap={1.2} alignItems="flex-start">
              <Box
                sx={{
                  minWidth: 24, height: 24, borderRadius: "50%",
                  bgcolor: gold, color: "#0D0D0D", fontWeight: 800, fontSize: "0.75rem",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {i + 1}
              </Box>
              <Typography sx={{ fontSize: "0.82rem", color: textMuted }}>
                {step}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Trending banner */}
      <Box
        sx={{
          borderRadius: 3,
          height: 150,
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #3a2a1a, #1a1a2e)",
        }}
      >
        <Box sx={{ position: "absolute", bottom: 12, left: 14 }}>
          <Typography sx={{ color: gold, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "1px" }}>
            NOW TRENDING
          </Typography>
          <Typography sx={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem" }}>
            98% Smile Rating
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default AIWishPage;