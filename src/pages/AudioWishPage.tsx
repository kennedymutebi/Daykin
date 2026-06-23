import React, { useState, useRef, useEffect } from "react";
import {
  Box, Typography, Button, TextField, LinearProgress,
  IconButton, Snackbar, Alert,
} from "@mui/material";
import MicIcon               from "@mui/icons-material/Mic";
import StopIcon              from "@mui/icons-material/Stop";
import PlayArrowIcon         from "@mui/icons-material/PlayArrow";
import PauseIcon             from "@mui/icons-material/Pause";
import DeleteIcon            from "@mui/icons-material/Delete";
import VideocamIcon          from "@mui/icons-material/Videocam";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AutoAwesomeIcon       from "@mui/icons-material/AutoAwesome";
import LockIcon              from "@mui/icons-material/Lock";
import CheckCircleIcon       from "@mui/icons-material/CheckCircle";
import { SERIF } from "../components/shared/constants";

// ── Types ─────────────────────────────────────────────────────────────────────
type RecordMode = "voice" | "video" | "text";
type Step       = "compose" | "preview" | "sent";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

const formatTime = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

// ── Waveform ──────────────────────────────────────────────────────────────────
const Waveform: React.FC<{ recording: boolean }> = ({ recording }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", height: 40 }}>
    {Array.from({ length: 28 }, (_, i) => (
      <Box key={i} sx={{
        width: "3px", borderRadius: "2px", minHeight: "4px",
        bgcolor: recording ? "#e11d48" : "rgba(245,158,11,0.4)",
        height: recording ? undefined : "6px",
        animation: recording
          ? `wave ${0.6 + (i % 5) * 0.12}s ${i * 0.04}s ease-in-out infinite alternate`
          : "none",
        "@keyframes wave": {
          "0%":   { height: "4px" },
          "100%": { height: `${10 + (i % 7) * 4}px` },
        },
      }} />
    ))}
  </Box>
);

// ── Paid badge ────────────────────────────────────────────────────────────────
const PaidBadge: React.FC = () => (
  <Box sx={{
    display: "inline-flex", alignItems: "center", gap: 0.5,
    bgcolor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.4)",
    borderRadius: "20px", px: 1.2, py: 0.3,
  }}>
    <LockIcon sx={{ fontSize: 10, color: "#F59E0B" }} />
    <Typography sx={{ fontFamily: SERIF, fontSize: "0.62rem", fontWeight: 800, color: "#F59E0B", letterSpacing: "0.06em" }}>
      PRO
    </Typography>
  </Box>
);

// ── Mode tab ──────────────────────────────────────────────────────────────────
const ModeTab: React.FC<{
  active: boolean; icon: React.ReactNode; label: string;
  pro?: boolean; onClick: () => void;
}> = ({ active, icon, label, pro, onClick }) => (
  <Box onClick={onClick} sx={{
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    gap: 0.5, py: 1.5, cursor: "pointer", borderRadius: "12px",
    transition: "all 0.2s",
    bgcolor: active ? "rgba(245,158,11,0.08)" : "transparent",
    border: "1px solid",
    borderColor: active ? "rgba(245,158,11,0.4)" : "transparent",
  }}>
    <Box sx={{ color: active ? "#F59E0B" : "#6B7280", "& svg": { fontSize: 22 } }}>{icon}</Box>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem", fontWeight: 700, color: active ? "#F59E0B" : "#6B7280" }}>
        {label}
      </Typography>
      {pro && <PaidBadge />}
    </Box>
  </Box>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const AudioWishPage: React.FC = () => {
  const [mode, setMode]             = useState<RecordMode>("voice");
  const [step, setStep]             = useState<Step>("compose");
  const [toName, setToName]         = useState("");
  const [fromName, setFromName]     = useState("");
  const [textMsg, setTextMsg]       = useState("");
  const [photo, setPhoto]           = useState<string | null>(null);
  const [recording, setRecording]   = useState(false);
  const [recorded, setRecorded]     = useState(false);
  const [playing, setPlaying]       = useState(false);
  const [elapsed, setElapsed]       = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [audioUrl, setAudioUrl]     = useState<string | null>(null);
  const [errors, setErrors]         = useState<{ to?: string; from?: string; msg?: string }>({});
  const [snack, setSnack]           = useState<{ open: boolean; msg: string; severity: "success" | "error" }>({
    open: false, msg: "", severity: "success",
  });

  const mediaRef  = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElem = useRef<HTMLAudioElement | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const photoRef  = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!toName.trim())                        e.to  = "Enter their name";
    if (!fromName.trim())                      e.from = "Enter your name";
    if (mode === "text" && !textMsg.trim())    e.msg  = "Write your message";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      setSnack({ open: true, msg: "Microphone not supported on this browser.", severity: "error" });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setRecorded(true);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } catch {
      setSnack({ open: true, msg: "Could not access microphone. Please allow permission.", severity: "error" });
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const deleteRecording = () => {
    setRecorded(false); setAudioUrl(null); setElapsed(0); setPlaying(false);
  };

  const togglePlay = () => {
    if (!audioUrl) return;
    if (!audioElem.current) audioElem.current = new Audio(audioUrl);
    if (playing) {
      audioElem.current.pause(); setPlaying(false);
    } else {
      audioElem.current.play(); setPlaying(true);
      audioElem.current.onended = () => setPlaying(false);
    }
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSnack({ open: true, msg: "Image must be under 5MB", severity: "error" }); return;
    }
    setPhoto(await fileToBase64(file));
    e.target.value = "";
  };

  const handleGenerateAudio = async () => {
    if (!validate()) return;
    setGenerating(true); setGenProgress(0);
    const iv = setInterval(() => setGenProgress(p => Math.min(p + 12, 90)), 350);
    await new Promise(r => setTimeout(r, 3200));
    clearInterval(iv); setGenProgress(100);
    await new Promise(r => setTimeout(r, 400));
    setGenerating(false); setStep("preview");
  };

  const handleSend = () => {
    if (!validate()) return;
    if (mode === "voice" && !recorded) {
      setSnack({ open: true, msg: "Please record your message first.", severity: "error" }); return;
    }
    setStep("sent");
  };

  const resetAll = () => {
    setStep("compose"); setToName(""); setFromName(""); setTextMsg("");
    setPhoto(null); setRecorded(false); setAudioUrl(null); setElapsed(0);
    setPlaying(false); setErrors({}); setGenProgress(0);
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", px: { xs: 2, sm: 3 }, py: { xs: 4, md: 6 } }}>

      {/* ── Page heading ── */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{
          fontFamily: SERIF, fontWeight: 900,
          fontSize: { xs: "1.8rem", sm: "2.4rem" },
          color: "#1a1207", lineHeight: 1.1, mb: 1,
        }}>
          🎙️ Send a wish they'll<br />
          <Box component="span" sx={{
            background: "linear-gradient(135deg, #92400E, #F59E0B)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>
            never forget.
          </Box>
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: "0.9rem", color: "#6B7280", lineHeight: 1.7 }}>
          Record your voice, shoot a video clip, or let AI read your message aloud — all as a beautiful birthday wish.
        </Typography>
      </Box>

      {/* ══════════════════ COMPOSE ══════════════════ */}
      {step === "compose" && (
        <>
          {/* Names row */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 2.5 }}>
            <Box>
              <Typography sx={labelSx}>TO *</Typography>
              <TextField fullWidth size="small" placeholder="Their name"
                value={toName}
                onChange={e => { setToName(e.target.value); setErrors(v => ({ ...v, to: undefined })); }}
                error={!!errors.to} helperText={errors.to} sx={fieldSx} />
            </Box>
            <Box>
              <Typography sx={labelSx}>FROM *</Typography>
              <TextField fullWidth size="small" placeholder="Your name"
                value={fromName}
                onChange={e => { setFromName(e.target.value); setErrors(v => ({ ...v, from: undefined })); }}
                error={!!errors.from} helperText={errors.from} sx={fieldSx} />
            </Box>
          </Box>

          {/* Photo */}
          <Box sx={{
            display: "flex", alignItems: "center", gap: 2, p: 1.8, mb: 2.5,
            border: "1.5px dashed #FDE68A", borderRadius: "14px",
            bgcolor: "#FFFBF0", cursor: "pointer",
          }} onClick={() => photoRef.current?.click()}>
            <Box sx={{
              width: 56, height: 56, borderRadius: "50%", overflow: "hidden",
              bgcolor: "#FEF3C7", border: "2px solid #F59E0B",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {photo
                ? <Box component="img" src={photo} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <AddPhotoAlternateIcon sx={{ fontSize: 24, color: "#92400E" }} />}
            </Box>
            <Box>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem", color: "#92400E" }}>
                {photo ? "✓ Photo attached" : "Attach their photo (optional)"}
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#B45309", mt: 0.3 }}>
                Shown on the birthday wish card they receive
              </Typography>
            </Box>
            <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
          </Box>

          {/* Mode tabs */}
          <Typography sx={labelSx}>HOW DO YOU WANT TO SEND YOUR WISH?</Typography>
          <Box sx={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1,
            bgcolor: "#F9FAFB", borderRadius: "16px",
            border: "1px solid #E5E7EB", p: 1, mb: 2.5,
          }}>
            <ModeTab active={mode === "voice"} icon={<MicIcon />}          label="Voice"    onClick={() => setMode("voice")} />
            <ModeTab active={mode === "video"} icon={<VideocamIcon />}     label="Video"    onClick={() => setMode("video")} />
            <ModeTab active={mode === "text"}  icon={<AutoAwesomeIcon />}  label="AI Voice" pro onClick={() => setMode("text")} />
          </Box>

          {/* ── Voice recorder ── */}
          {mode === "voice" && (
            <Box sx={{
              bgcolor: "#F9FAFB", border: "1px solid #E5E7EB",
              borderRadius: "20px", p: 3, textAlign: "center", mb: 2.5,
            }}>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", color: "#6B7280", mb: 2 }}>
                Record your voice message — up to 2 minutes
              </Typography>

              <Waveform recording={recording} />

              <Typography sx={{
                fontFamily: SERIF, fontSize: "1.6rem", fontWeight: 900,
                color: recording ? "#e11d48" : "#D1D5DB",
                my: 1.5, letterSpacing: "0.08em",
              }}>
                {formatTime(elapsed)}
              </Typography>

              {!recorded ? (
                !recording ? (
                  <Button variant="contained" startIcon={<MicIcon />} onClick={startRecording} sx={primaryBtnSx}>
                    Start Recording
                  </Button>
                ) : (
                  <Button variant="contained" startIcon={<StopIcon />} onClick={stopRecording}
                    sx={{ ...primaryBtnSx, background: "#e11d48", "&:hover": { background: "#be123c" } }}>
                    Stop
                  </Button>
                )
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, alignItems: "center" }}>
                  <IconButton onClick={togglePlay} sx={{
                    bgcolor: "rgba(245,158,11,0.12)", color: "#F59E0B",
                    "&:hover": { bgcolor: "rgba(245,158,11,0.22)" },
                  }}>
                    {playing ? <PauseIcon /> : <PlayArrowIcon />}
                  </IconButton>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.82rem", color: "#374151", fontWeight: 600 }}>
                    Recording ready · {formatTime(elapsed)}
                  </Typography>
                  <IconButton onClick={deleteRecording} size="small"
                    sx={{ color: "#D1D5DB", "&:hover": { color: "#e11d48" } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}

          {/* ── Video recorder ── */}
          {mode === "video" && (
            <Box sx={{
              bgcolor: "#F9FAFB", border: "1px solid #E5E7EB",
              borderRadius: "20px", p: 3, textAlign: "center", mb: 2.5,
            }}>
              <Box sx={{ fontSize: "2.5rem", mb: 1.5 }}>🎥</Box>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "1rem", color: "#1a1a1a", mb: 1 }}>
                Record a short video message
              </Typography>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem", color: "#6B7280", mb: 2.5, lineHeight: 1.7 }}>
                Use your camera to record up to 60 seconds.<br />It will be included in their birthday wish.
              </Typography>
              <Button variant="contained" startIcon={<VideocamIcon />} sx={primaryBtnSx}
                onClick={() => setSnack({ open: true, msg: "Camera recording — connect to backend to enable.", severity: "success" })}>
                Open Camera
              </Button>
            </Box>
          )}

          {/* ── AI Voice (paid) ── */}
          {mode === "text" && (
            <Box sx={{
              bgcolor: "#FFFBF0", border: "1px solid #FDE68A",
              borderRadius: "20px", p: 3, mb: 2.5,
            }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <LockIcon sx={{ fontSize: 14, color: "#92400E" }} />
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", fontWeight: 700, color: "#92400E", letterSpacing: "0.06em" }}>
                  PRO — AI reads your message aloud as a phone call
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.78rem", color: "#B45309", mb: 2, lineHeight: 1.65 }}>
                Write your message and AI generates a warm, human-sounding voice — delivered as a phone call on their birthday morning.
              </Typography>
              <Typography sx={labelSx}>YOUR MESSAGE *</Typography>
              <TextField fullWidth multiline minRows={4}
                placeholder={`Write what you want to say to ${toName || "them"} on their birthday…`}
                value={textMsg}
                onChange={e => { setTextMsg(e.target.value); setErrors(v => ({ ...v, msg: undefined })); }}
                error={!!errors.msg} helperText={errors.msg} sx={fieldSx} />

              {generating && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress variant="determinate" value={genProgress} sx={{
                    height: 6, borderRadius: 4, bgcolor: "#FEF3C7",
                    "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #F59E0B, #FBBF24)", borderRadius: 4 },
                  }} />
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", color: "#B45309", mt: 0.8, textAlign: "center" }}>
                    {genProgress < 40 ? "Crafting your message…" : genProgress < 75 ? "Generating voice…" : "Almost ready…"}
                  </Typography>
                </Box>
              )}

              <Button fullWidth variant="contained" onClick={handleGenerateAudio}
                disabled={generating}
                startIcon={<AutoAwesomeIcon sx={{ fontSize: "16px !important" }} />}
                sx={{ ...primaryBtnSx, mt: 2 }}>
                {generating ? "Generating…" : "Generate AI Voice →"}
              </Button>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem", color: "#D1D5DB", textAlign: "center", mt: 1 }}>
                Requires Pro plan · powered by ElevenLabs / OpenAI TTS
              </Typography>
            </Box>
          )}

          {/* Send button (voice + video) */}
          {(mode === "voice" || mode === "video") && (
            <Button fullWidth variant="contained" onClick={handleSend} sx={primaryBtnSx}>
              Send Birthday Wish →
            </Button>
          )}
        </>
      )}

      {/* ══════════════════ PREVIEW (AI) ══════════════════ */}
      {step === "preview" && (
        <Box sx={{
          bgcolor: "#FFFBF0", border: "1px solid #FDE68A",
          borderRadius: "24px", p: { xs: 3, sm: 4 }, textAlign: "center",
        }}>
          <Box sx={{ fontSize: "3rem", mb: 2 }}>🎙️</Box>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "1.5rem", color: "#1a1207", mb: 1 }}>
            AI voice ready!
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.88rem", color: "#6B7280", mb: 3, lineHeight: 1.7 }}>
            Your message has been transformed into a warm, personal voice message for{" "}
            <Box component="span" sx={{ color: "#92400E", fontWeight: 700 }}>{toName}</Box>.
          </Typography>

          {/* fake player */}
          <Box sx={{
            bgcolor: "#fff", border: "1px solid #FDE68A",
            borderRadius: "14px", p: 2, mb: 3,
            display: "flex", alignItems: "center", gap: 2,
          }}>
            <IconButton sx={{ bgcolor: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>
              <PlayArrowIcon />
            </IconButton>
            <Waveform recording={false} />
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.75rem", color: "#9CA3AF", flexShrink: 0 }}>0:32</Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="outlined" onClick={() => setStep("compose")} sx={{
              flex: 1, fontFamily: SERIF, fontWeight: 700, textTransform: "none",
              borderRadius: "12px", borderColor: "#E5E7EB", color: "#374151",
              "&:hover": { borderColor: "#D1D5DB", bgcolor: "#F9FAFB" },
            }}>← Redo</Button>
            <Button variant="contained" onClick={() => setStep("sent")} sx={{ ...primaryBtnSx, flex: 2 }}>
              Send this wish →
            </Button>
          </Box>
        </Box>
      )}

      {/* ══════════════════ SENT ══════════════════ */}
      {step === "sent" && (
        <Box sx={{
          bgcolor: "#F0FDF4", border: "1px solid #86EFAC",
          borderRadius: "24px", p: { xs: 3, sm: 5 }, textAlign: "center",
        }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: "50%",
            bgcolor: "rgba(22,163,74,0.12)", border: "2px solid rgba(22,163,74,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            mx: "auto", mb: 3,
            animation: "popIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
            "@keyframes popIn": {
              "0%":   { transform: "scale(0)", opacity: 0 },
              "100%": { transform: "scale(1)", opacity: 1 },
            },
          }}>
            <CheckCircleIcon sx={{ fontSize: 40, color: "#16a34a" }} />
          </Box>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "1.6rem", color: "#1a1207", mb: 1 }}>
            Wish delivered! 🎂
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.88rem", color: "#374151", mb: 4, lineHeight: 1.7 }}>
            <Box component="span" sx={{ fontWeight: 700 }}>{toName}</Box> will receive your birthday wish.
            {mode === "text"  && " They'll get a phone call on their birthday morning."}
            {mode === "voice" && " Your voice message has been saved to their wish card."}
            {mode === "video" && " Your video message has been saved to their wish card."}
          </Typography>
          <Button variant="contained" onClick={resetAll} sx={primaryBtnSx}>
            Send another wish
          </Button>
        </Box>
      )}

      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} sx={{ fontFamily: SERIF, fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const labelSx = {
  fontFamily: SERIF, fontSize: "0.72rem", fontWeight: 700,
  color: "#6B7280", mb: 0.5, letterSpacing: "0.05em", display: "block",
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: SERIF, fontSize: "0.88rem", borderRadius: "10px", bgcolor: "#F9FAFB",
    "& fieldset":             { borderColor: "#E5E7EB" },
    "&:hover fieldset":       { borderColor: "#D1D5DB" },
    "&.Mui-focused fieldset": { borderColor: "#F59E0B", borderWidth: "1.5px" },
  },
  "& .MuiFormHelperText-root": { fontFamily: SERIF, fontSize: "0.72rem", ml: "2px" },
};

const primaryBtnSx = {
  background: "linear-gradient(135deg, #1a1207 0%, #3d2a00 60%, #F59E0B 100%)",
  color: "#FEF3C7", fontFamily: SERIF, fontWeight: 800,
  fontSize: "0.9rem", textTransform: "none" as const, borderRadius: "12px", py: 1.3,
  boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
  transition: "all 0.2s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #2d1f00 0%, #4a3200 60%, #FBBF24 100%)",
    boxShadow: "0 6px 28px rgba(245,158,11,0.45)",
    transform: "translateY(-1px)",
  },
};

export default AudioWishPage;