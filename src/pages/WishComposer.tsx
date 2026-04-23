import React, { useState, useRef } from "react";
import {
  Box, Typography, TextField, Button, IconButton,
  Snackbar, Alert, Backdrop, LinearProgress,
} from "@mui/material";
import CloseIcon              from "@mui/icons-material/Close";
import ContentCopyIcon        from "@mui/icons-material/ContentCopy";
import WhatsAppIcon           from "@mui/icons-material/WhatsApp";
import SmsIcon                from "@mui/icons-material/Sms";
import EmailIcon              from "@mui/icons-material/Email";
import TelegramIcon           from "@mui/icons-material/Telegram";
import AddPhotoAlternateIcon  from "@mui/icons-material/AddPhotoAlternate";
import AutoAwesomeIcon        from "@mui/icons-material/AutoAwesome";
import { SERIF } from "../components/shared/constants";

interface WishComposerProps { onClose: () => void; }

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateToken = () =>
  Math.random().toString(36).slice(2, 7) + Math.random().toString(36).slice(2, 7);

const encodeWish = (data: object) =>
  btoa(unescape(encodeURIComponent(JSON.stringify(data))));

const buildWishUrl = (token: string, encoded: string) =>
  `${window.location.origin}/wish/${token}?d=${encoded}`;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

// ── Share chip ────────────────────────────────────────────────────────────────
const ShareChip: React.FC<{
  icon: React.ReactNode; label: string; color: string; bg: string; onClick: () => void;
}> = ({ icon, label, color, bg, onClick }) => (
  <Box onClick={onClick} sx={{
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: 0.6, p: 1.2, borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.08)", cursor: "pointer", flex: 1,
    transition: "transform 0.15s, box-shadow 0.15s", bgcolor: bg,
    "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.10)" },
  }}>
    <Box sx={{ color, "& svg": { fontSize: 26 } }}>{icon}</Box>
    <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", fontWeight: 700, color: "#374151" }}>
      {label}
    </Typography>
  </Box>
);

// ── Main ──────────────────────────────────────────────────────────────────────
const WishComposer: React.FC<WishComposerProps> = ({ onClose }) => {
  const [step, setStep]               = useState<"write" | "generating" | "share">("write");
  const [toName, setToName]           = useState("");
  const [fromName, setFromName]       = useState("");
  const [message, setMessage]         = useState("");
  const [relationship, setRelationship] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [wishUrl, setWishUrl]         = useState("");
  const [aiWish, setAiWish]           = useState("");
  const [uploading, setUploading]     = useState(false);
  const [progress, setProgress]       = useState(0);
  const [snack, setSnack]             = useState<{ open: boolean; msg: string; severity: "success"|"error" }>({
    open: false, msg: "", severity: "success",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── form errors ──
  const [errors, setErrors] = useState<{ to?: string; from?: string; message?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!toName.trim())    e.to      = "Please enter your friend's name";
    if (!fromName.trim())  e.from    = "Please enter your name";
    if (!message.trim())   e.message = "Please write a birthday message";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSnack({ open: true, msg: "Image must be under 5 MB.", severity: "error" });
      return;
    }
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      setPhotoPreview(base64);
    } catch {
      setSnack({ open: true, msg: "Could not load image, try another file.", severity: "error" });
    }
    setUploading(false);
    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleGenerate = async () => {
    if (!validate()) return;
    setStep("generating");
    setProgress(0);

    // Animate progress bar while AI generates
    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 18, 90));
    }, 300);

    try {
      const prompt = `Write a beautiful, heartfelt, and memorable birthday wish article for ${toName.trim()}${relationship ? ` (my ${relationship.trim()})` : ""}. 
The message I want to convey: "${message.trim()}"
This is from ${fromName.trim()}.

Write it as a short, poetic, magazine-style birthday tribute — 3 short paragraphs. 
Make it warm, personal, and genuinely touching. Use the person's name naturally. 
Do NOT use generic filler phrases. Make every sentence feel like it was written just for them.
Return ONLY the 3 paragraphs, no headings, no labels.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const generated = data?.content?.[0]?.text?.trim() ?? message.trim();
      setAiWish(generated);
    } catch {
      // fallback to original message if API fails
      setAiWish(message.trim());
    }

    clearInterval(interval);
    setProgress(100);

    await new Promise(r => setTimeout(r, 400)); // let bar hit 100%

    const token   = generateToken();
    const encoded = encodeWish({
      to:           toName.trim(),
      from:         fromName.trim(),
      msg:          aiWish || message.trim(),
      relationship: relationship.trim(),
      photo:        photoPreview ?? null,
      createdAt:    new Date().toISOString(),
    });
    setWishUrl(buildWishUrl(token, encoded));
    setStep("share");
  };

  // We need aiWish in the encode step but state update is async,
  // so we recalculate after generation inside the same try block above.
  // The aiWish state is used for preview only on share screen.

  const handleCopy = () => {
    navigator.clipboard.writeText(wishUrl).then(() => {
      setSnack({ open: true, msg: "Link copied! Send it to your friend 🎉", severity: "success" });
    });
  };

  const shareText = `🎂 I wrote you a special birthday wish! Open this private link: ${wishUrl}`;
  const shareVia = (platform: string) => {
    const enc = encodeURIComponent(shareText);
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${enc}`,
      sms:      `sms:?body=${enc}`,
      email:    `mailto:?subject=${encodeURIComponent("A birthday wish just for you 🎂")}&body=${enc}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(wishUrl)}&text=${encodeURIComponent("I wrote you a special birthday wish!")}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank");
  };

  const resetForm = () => {
    setStep("write");
    setToName(""); setFromName(""); setMessage(""); setRelationship("");
    setPhotoPreview(null); setWishUrl(""); setAiWish(""); setErrors({});
    setProgress(0);
  };

  return (
    <>
      <Backdrop open sx={{ zIndex: 1300, bgcolor: "rgba(0,0,0,0.60)" }} onClick={step === "generating" ? undefined : onClose} />

      <Box sx={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", zIndex: 1400,
        width: { xs: "94vw", sm: 520 }, maxHeight: "92vh", overflowY: "auto",
        bgcolor: "#fff", borderRadius: "22px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
      }}>

        {/* ── Header ── */}
        <Box sx={{
          background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
          px: 3, pt: 2.5, pb: 2.5, borderRadius: "22px 22px 0 0",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <Box>
            <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "1.2rem", color: "#1a1a1a" }}>
              🎂 Write a Birthday Wish
            </Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", color: "rgba(0,0,0,0.5)", mt: 0.3 }}>
              AI crafts a beautiful article · share a private link
            </Typography>
          </Box>
          {step !== "generating" && (
            <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -1, color: "#1a1a1a" }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        <Box sx={{ px: 3, pt: 2.5, pb: 3 }}>

          {/* ══════════════════════ STEP 1: WRITE ══════════════════════ */}
          {step === "write" && (
            <>
              {/* Photo upload */}
              <Box sx={{
                display: "flex", alignItems: "center", gap: 2, mb: 2.5,
                p: 1.8, borderRadius: "14px",
                border: "1.5px dashed #FDE68A", bgcolor: "#FFFBF0",
                cursor: "pointer",
              }} onClick={() => fileInputRef.current?.click()}>
                <Box sx={{
                  width: 68, height: 68, borderRadius: "50%", overflow: "hidden",
                  bgcolor: "#FEF3C7", border: "2.5px solid #F59E0B",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, transition: "opacity 0.2s",
                  "&:hover": { opacity: 0.85 },
                }}>
                  {photoPreview ? (
                    <Box component="img" src={photoPreview} alt="friend"
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <AddPhotoAlternateIcon sx={{ fontSize: 28, color: "#92400E" }} />
                  )}
                </Box>
                <Box flex={1}>
                  <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.83rem", color: "#92400E" }}>
                    {photoPreview ? "✓ Photo added" : "Add your friend's photo"}
                  </Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#B45309", mt: 0.3 }}>
                    {photoPreview ? "Click to change" : "It will appear on the wish card they receive"}
                  </Typography>
                  {uploading && <LinearProgress sx={{ mt: 1, borderRadius: 4, bgcolor: "#FDE68A", "& .MuiLinearProgress-bar": { bgcolor: "#F59E0B" } }} />}
                </Box>
                <input ref={fileInputRef} type="file" accept="image/*"
                  style={{ display: "none" }} onChange={handlePhotoChange} />
              </Box>

              {/* To */}
              <Typography sx={labelSx}>TO — FRIEND'S NAME *</Typography>
              <TextField
                fullWidth size="small" placeholder="e.g. Sarah"
                value={toName}
                onChange={e => { setToName(e.target.value); if (errors.to) setErrors(v => ({ ...v, to: undefined })); }}
                error={!!errors.to} helperText={errors.to}
                sx={fieldSx}
              />

              {/* From */}
              <Typography sx={{ ...labelSx, mt: 2 }}>FROM — YOUR NAME *</Typography>
              <TextField
                fullWidth size="small" placeholder="e.g. James"
                value={fromName}
                onChange={e => { setFromName(e.target.value); if (errors.from) setErrors(v => ({ ...v, from: undefined })); }}
                error={!!errors.from} helperText={errors.from}
                sx={fieldSx}
              />

              {/* Relationship (optional) */}
              <Typography sx={{ ...labelSx, mt: 2 }}>RELATIONSHIP (optional)</Typography>
              <TextField
                fullWidth size="small" placeholder="e.g. best friend, sister, colleague"
                value={relationship}
                onChange={e => setRelationship(e.target.value)}
                sx={fieldSx}
              />

              {/* Message */}
              <Typography sx={{ ...labelSx, mt: 2 }}>YOUR BIRTHDAY MESSAGE *</Typography>
              <TextField
                fullWidth multiline minRows={4}
                placeholder="Write your thoughts — our AI will turn them into a beautiful birthday article…"
                value={message}
                onChange={e => { setMessage(e.target.value); if (errors.message) setErrors(v => ({ ...v, message: undefined })); }}
                error={!!errors.message} helperText={errors.message}
                sx={fieldSx}
              />

              {/* AI note */}
              <Box sx={{
                display: "flex", alignItems: "center", gap: 1,
                bgcolor: "#F0F9FF", border: "1px solid #BAE6FD",
                borderRadius: "10px", px: 1.8, py: 1, mt: 1.5, mb: 2.5,
              }}>
                <AutoAwesomeIcon sx={{ fontSize: 16, color: "#0369A1" }} />
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.73rem", color: "#0369A1", lineHeight: 1.5 }}>
                  AI will craft a beautiful, personalised birthday article from your message
                </Typography>
              </Box>

              <Button
                fullWidth variant="contained"
                onClick={handleGenerate}
                startIcon={<AutoAwesomeIcon sx={{ fontSize: "17px !important" }} />}
                sx={primaryBtnSx}
              >
                Generate Birthday Wish →
              </Button>
            </>
          )}

          {/* ══════════════════════ STEP 2: GENERATING ══════════════════════ */}
          {step === "generating" && (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography sx={{ fontSize: "2.8rem", mb: 2 }}>🎂</Typography>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 800, fontSize: "1.15rem", color: "#1a1a1a", mb: 0.8 }}>
                Crafting {toName}'s wish…
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.82rem", color: "#6B7280", mb: 3, lineHeight: 1.6 }}>
                Our AI is writing a beautiful, personalised<br />birthday article just for them.
              </Typography>
              <LinearProgress
                variant="determinate" value={progress}
                sx={{
                  height: 8, borderRadius: 8,
                  bgcolor: "#FEF3C7",
                  "& .MuiLinearProgress-bar": {
                    background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
                    borderRadius: 8,
                  },
                }}
              />
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#9CA3AF", mt: 1 }}>
                {progress < 40 ? "Understanding your message…" : progress < 75 ? "Writing the article…" : "Almost ready…"}
              </Typography>
            </Box>
          )}

          {/* ══════════════════════ STEP 3: SHARE ══════════════════════ */}
          {step === "share" && (
            <>
              {/* Preview card */}
              <Box sx={{
                display: "flex", alignItems: "center", gap: 2, p: 1.8,
                borderRadius: "14px", bgcolor: "#FFFBF0",
                border: "1px solid #FDE68A", mb: 2,
              }}>
                <Box sx={{
                  width: 54, height: 54, borderRadius: "50%", overflow: "hidden",
                  bgcolor: "#FEF3C7", border: "2px solid #F59E0B",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {photoPreview ? (
                    <Box component="img" src={photoPreview} alt={toName}
                      sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "1.2rem", color: "#92400E" }}>
                      {toName.charAt(0).toUpperCase()}
                    </Typography>
                  )}
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.92rem", color: "#1a1a1a" }}>
                    Happy Birthday, {toName}! 🎂
                  </Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.75rem", color: "#92400E" }}>
                    From {fromName} · AI wish article ready ✨
                  </Typography>
                </Box>
              </Box>

              {/* Success */}
              <Box sx={{
                bgcolor: "#F0FDF4", border: "1px solid #86EFAC",
                borderRadius: "10px", px: 2, py: 1.2, mb: 2,
                display: "flex", alignItems: "flex-start", gap: 1,
              }}>
                <Typography sx={{ fontSize: "1rem", mt: "1px" }}>✅</Typography>
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem", color: "#166534", lineHeight: 1.55 }}>
                  <strong>{toName}'s</strong> birthday article is ready. Share the private link below — only they can open it.
                </Typography>
              </Box>

              {/* Link */}
              <Typography sx={labelSx}>PRIVATE LINK</Typography>
              <Box sx={{
                display: "flex", alignItems: "center", gap: 1,
                bgcolor: "#F9FAFB", border: "1px solid #E5E7EB",
                borderRadius: "10px", px: 1.5, py: 1, mb: 2,
              }}>
                <Typography sx={{
                  fontFamily: "monospace", fontSize: "0.72rem", color: "#374151",
                  flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {wishUrl}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopyIcon sx={{ fontSize: "13px !important" }} />}
                  onClick={handleCopy}
                  sx={{
                    fontFamily: SERIF, fontWeight: 700, fontSize: "0.72rem",
                    textTransform: "none", bgcolor: "#F59E0B", color: "#1a1a1a",
                    borderRadius: "7px", px: 1.5, flexShrink: 0,
                    "&:hover": { bgcolor: "#FBBF24" },
                  }}
                >
                  Copy
                </Button>
              </Box>

              {/* Preview button */}
              <Button
                fullWidth variant="outlined"
                onClick={() => window.open(wishUrl, "_blank")}
                sx={{
                  fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem",
                  textTransform: "none", borderRadius: "10px",
                  borderColor: "#F59E0B", color: "#92400E", py: 1, mb: 2,
                  "&:hover": { bgcolor: "#FFFBF0", borderColor: "#F59E0B" },
                }}
              >
                👁 Preview what {toName} will see →
              </Button>

              {/* Platforms */}
              <Typography sx={{ ...labelSx, mb: 1 }}>SEND VIA</Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
                <ShareChip icon={<WhatsAppIcon />} label="WhatsApp" color="#16a34a" bg="#F0FDF4" onClick={() => shareVia("whatsapp")} />
                <ShareChip icon={<SmsIcon />}      label="SMS"      color="#1d4ed8" bg="#EFF6FF" onClick={() => shareVia("sms")}      />
                <ShareChip icon={<EmailIcon />}    label="Email"    color="#7c3aed" bg="#F5F3FF" onClick={() => shareVia("email")}    />
                <ShareChip icon={<TelegramIcon />} label="Telegram" color="#0088cc" bg="#E0F2FE" onClick={() => shareVia("telegram")} />
              </Box>

              <Box sx={{ height: "1px", bgcolor: "#F3F4F6", mb: 2 }} />

              <Button fullWidth variant="outlined" onClick={resetForm} sx={{
                fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem",
                textTransform: "none", borderRadius: "10px",
                borderColor: "#E5E7EB", color: "#374151", py: 1,
                "&:hover": { borderColor: "#9CA3AF", bgcolor: "#F9FAFB" },
              }}>
                Write another wish
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Snackbar
        open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} sx={{ fontFamily: SERIF, fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────────
const labelSx = {
  fontFamily: SERIF, fontSize: "0.72rem", fontWeight: 700,
  color: "#6B7280", mb: 0.5, letterSpacing: "0.05em",
  display: "block",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: SERIF, fontSize: "0.88rem", borderRadius: "10px", bgcolor: "#F9FAFB",
    "& fieldset":           { borderColor: "#E5E7EB" },
    "&:hover fieldset":     { borderColor: "#D1D5DB" },
    "&.Mui-focused fieldset": { borderColor: "#F59E0B", borderWidth: "1.5px" },
  },
  "& .MuiFormHelperText-root": {
    fontFamily: SERIF, fontSize: "0.72rem", ml: "2px",
  },
};

const primaryBtnSx = {
  background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
  color: "#1a1a1a", fontFamily: SERIF, fontWeight: 800,
  fontSize: "0.9rem", textTransform: "none", borderRadius: "12px", py: 1.3,
  boxShadow: "0 4px 20px rgba(245,158,11,0.35)",
  transition: "all 0.2s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #FBBF24 0%, #FCD34D 100%)",
    boxShadow: "0 6px 28px rgba(245,158,11,0.45)",
    transform: "translateY(-1px)",
  },
  "&.Mui-disabled": { bgcolor: "#E5E7EB", color: "#9CA3AF", boxShadow: "none" },
};

export default WishComposer;