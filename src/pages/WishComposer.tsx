import React, { useState, useRef, useEffect } from "react";
import {
  Box, Typography, TextField, Button, IconButton,
  Snackbar, Alert, LinearProgress, Chip,
} from "@mui/material";
import CloseIcon             from "@mui/icons-material/Close";
import ContentCopyIcon       from "@mui/icons-material/ContentCopy";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import AutoAwesomeIcon       from "@mui/icons-material/AutoAwesome";
import FavoriteIcon          from "@mui/icons-material/Favorite";
import EmojiEmotionsIcon     from "@mui/icons-material/EmojiEmotions";
import CheckCircleIcon       from "@mui/icons-material/CheckCircle";
import { SERIF }             from "../components/shared/constants";

// ── Types ─────────────────────────────────────────────────────────────────────
type Vibe     = "heartfelt" | "prayerful" | "funny" | "proud" | "poetic" | "nostalgic";
type Relation = "friend" | "family" | "colleague" | "partner" | "classmate" | "mentor";
type Page     = "tribute" | "schedule" | "processing" | "wall";

interface WishComposerProps {
  onClose: () => void;
}

interface TributeData {
  toName: string;
  fromName: string;
  relation: Relation | "";
  tribute: string;
  photo: string | null;
}

interface ScheduleData {
  phone: string;
  date: string;
  time: string;
  vibe: Vibe;
  memory: string;
  appreciation: string;
  achievement: string;
  video: string;
}

interface AllData extends TributeData, ScheduleData {
  summary: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const VIBES: { value: Vibe; label: string; emoji: string; color: string }[] = [
  { value: "heartfelt",  label: "Heartfelt",  emoji: "❤️",  color: "#e11d48" },
  { value: "prayerful",  label: "Prayerful",  emoji: "🙏",  color: "#7c3aed" },
  { value: "funny",      label: "Funny",      emoji: "😂",  color: "#ea580c" },
  { value: "proud",      label: "Proud",      emoji: "🌟",  color: "#0284c7" },
  { value: "poetic",     label: "Poetic",     emoji: "🌸",  color: "#db2777" },
  { value: "nostalgic",  label: "Nostalgic",  emoji: "🕰️", color: "#92400e" },
];

const RELATIONS: { value: Relation; label: string; emoji: string }[] = [
  { value: "friend",    label: "Friend",    emoji: "👫" },
  { value: "family",    label: "Family",    emoji: "👨‍👩‍👧" },
  { value: "colleague", label: "Colleague", emoji: "💼" },
  { value: "partner",   label: "Partner",   emoji: "💑" },
  { value: "classmate", label: "Classmate", emoji: "🎓" },
  { value: "mentor",    label: "Mentor",    emoji: "🌠" },
];

const REACTIONS = ["❤️", "🙏", "😭", "🎉", "🌟", "🥰"];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

// ── Shared sx ─────────────────────────────────────────────────────────────────
const labelSx = {
  fontFamily: SERIF, fontSize: "0.72rem", fontWeight: 700,
  color: "#6B7280", mb: 0.6, letterSpacing: "0.05em", display: "block",
} as const;

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    fontFamily: SERIF, fontSize: "0.88rem", borderRadius: "10px", bgcolor: "#F9FAFB",
    "& fieldset":             { borderColor: "#E5E7EB" },
    "&:hover fieldset":       { borderColor: "#D1D5DB" },
    "&.Mui-focused fieldset": { borderColor: "#F59E0B", borderWidth: "1.5px" },
  },
  "& .MuiFormHelperText-root": { fontFamily: SERIF, fontSize: "0.72rem", ml: "2px" },
} as const;

const primaryBtnSx = {
  background: "linear-gradient(135deg, #1a1207 0%, #3d2a00 60%, #F59E0B 100%)",
  color: "#FEF3C7", fontFamily: SERIF, fontWeight: 800,
  fontSize: "0.9rem", textTransform: "none" as const,
  borderRadius: "12px", py: 1.3,
  boxShadow: "0 4px 20px rgba(245,158,11,0.3)",
  transition: "all 0.2s ease",
  "&:hover": {
    background: "linear-gradient(135deg, #2d1f00 0%, #4a3200 60%, #FBBF24 100%)",
    boxShadow: "0 6px 28px rgba(245,158,11,0.45)",
    transform: "translateY(-1px)",
  },
} as const;

const ghostBtnSx = {
  fontFamily: SERIF, fontWeight: 700, textTransform: "none" as const,
  borderRadius: "12px", borderColor: "#E5E7EB", color: "#374151",
  "&:hover": { borderColor: "#D1D5DB", bgcolor: "#F9FAFB" },
} as const;

// ── Shared page wrapper ───────────────────────────────────────────────────────
const PageShell: React.FC<{
  children: React.ReactNode;
  page: Page;
  onClose: () => void;
}> = ({ children, page, onClose }) => {
  const PAGE_LABELS: Record<Page, string> = {
    tribute:    "Step 1 of 3 — Write the tribute",
    schedule:   "Step 2 of 3 — Schedule the call",
    processing: "Generating...",
    wall:       "Birthday Wall",
  };
  const stepNum: Record<Page, number> = { tribute: 1, schedule: 2, processing: 3, wall: 3 };
  const current = stepNum[page];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FFFDF7", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <Box sx={{
        position: "sticky", top: 0, zIndex: 100,
        bgcolor: "rgba(255,253,247,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #FEF3C7",
        px: { xs: 2, sm: 4 }, py: 1.5,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 900, fontSize: "1.1rem", color: "#92400E" }}>
            🎂 WishCall
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#9CA3AF", ml: 1 }}>
            {PAGE_LABELS[page]}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {page !== "wall" && (
            <Box sx={{ display: "flex", gap: 0.6 }}>
              {[1, 2, 3].map(s => (
                <Box key={s} sx={{
                  width: s === current ? 20 : 7, height: 7, borderRadius: "4px",
                  bgcolor: s <= current ? "#F59E0B" : "#E5E7EB",
                  transition: "all 0.3s ease",
                }} />
              ))}
            </Box>
          )}
          <IconButton size="small" onClick={onClose}
            sx={{ color: "#9CA3AF", "&:hover": { color: "#374151", bgcolor: "#F3F4F6" } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Page content */}
      <Box sx={{ flex: 1, maxWidth: 720, width: "100%", mx: "auto", px: { xs: 2, sm: 4 }, py: 5 }}>
        {children}
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 1 — Write the Tribute
// ═══════════════════════════════════════════════════════════════════════════════
const PageTribute: React.FC<{
  onNext: (d: TributeData) => void;
  onClose: () => void;
}> = ({ onNext, onClose }) => {
  const [toName,   setToName]   = useState("");
  const [fromName, setFromName] = useState("");
  const [relation, setRelation] = useState<Relation | "">("");
  const [tribute,  setTribute]  = useState("");
  const [photo,    setPhoto]    = useState<string | null>(null);
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [snack,    setSnack]    = useState({ open: false, msg: "", severity: "error" as "error" | "success" });
  const photoRef = useRef<HTMLInputElement>(null);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!toName.trim())             e.toName   = "Enter their name";
    if (!fromName.trim())           e.fromName = "Enter your name";
    if (tribute.trim().length < 30) e.tribute  = "Write at least a few sentences — make it meaningful";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setSnack({ open: true, msg: "Image must be under 5 MB", severity: "error" });
      return;
    }
    setPhoto(await fileToBase64(file));
    e.target.value = "";
  };

  const handleNext = () => {
    if (validate()) onNext({ toName, fromName, relation, tribute, photo });
  };

  return (
    <PageShell page="tribute" onClose={onClose}>

      {/* Hero */}
      <Box sx={{ textAlign: "center", mb: 6 }}>
        <Typography sx={{
          fontSize: "3rem", mb: 1.5, display: "block",
          "@keyframes float": {
            "0%,100%": { transform: "translateY(0)" },
            "50%":     { transform: "translateY(-8px)" },
          },
          animation: "float 3s ease-in-out infinite",
        }}>
          🎂
        </Typography>
        <Typography variant="h1" sx={{
          fontFamily: SERIF, fontWeight: 900,
          fontSize: { xs: "1.9rem", sm: "2.6rem" },
          color: "#1a1207", lineHeight: 1.15, mb: 1.5,
        }}>
          Write a tribute for<br />
          <Box component="span" sx={{
            background: "linear-gradient(135deg,#c9a84c,#e8c870,#c9a84c)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            someone you love
          </Box>
        </Typography>
        <Typography sx={{
          fontFamily: SERIF, fontSize: "0.95rem", color: "#6B7280",
          maxWidth: 460, mx: "auto", lineHeight: 1.8,
        }}>
          Tell their story. Pour your heart out. We'll turn it into an emotional phone call they'll never forget.
        </Typography>
      </Box>

      {/* Names */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography sx={labelSx}>BIRTHDAY PERSON'S NAME *</Typography>
          <TextField fullWidth size="small" placeholder="e.g. Grace"
            value={toName}
            onChange={e => { setToName(e.target.value); setErrors(v => ({ ...v, toName: "" })); }}
            error={!!errors.toName} helperText={errors.toName} sx={fieldSx} />
        </Box>
        <Box>
          <Typography sx={labelSx}>YOUR NAME *</Typography>
          <TextField fullWidth size="small" placeholder="e.g. James"
            value={fromName}
            onChange={e => { setFromName(e.target.value); setErrors(v => ({ ...v, fromName: "" })); }}
            error={!!errors.fromName} helperText={errors.fromName} sx={fieldSx} />
        </Box>
      </Box>

      {/* Relationship */}
      <Typography sx={labelSx}>YOUR RELATIONSHIP</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 2.5 }}>
        {RELATIONS.map(r => (
          <Chip key={r.value} label={`${r.emoji} ${r.label}`} size="small"
            onClick={() => setRelation(r.value === relation ? "" : r.value)}
            sx={{
              fontFamily: SERIF, fontWeight: 700, fontSize: "0.72rem",
              cursor: "pointer", borderRadius: "20px",
              bgcolor:     relation === r.value ? "rgba(245,158,11,0.12)" : "#F9FAFB",
              color:       relation === r.value ? "#92400E" : "#6B7280",
              border:      "1px solid",
              borderColor: relation === r.value ? "rgba(245,158,11,0.5)" : "#E5E7EB",
              transition: "all 0.15s",
              "&:hover": { borderColor: "#F59E0B", bgcolor: "rgba(245,158,11,0.08)" },
            }} />
        ))}
      </Box>

      {/* Photo */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 2, p: 2, mb: 2.5,
        border: "1.5px dashed #FDE68A", borderRadius: "14px",
        bgcolor: "#FFFBF0", cursor: "pointer",
        "&:hover": { borderColor: "#F59E0B" }, transition: "border-color 0.2s",
      }} onClick={() => photoRef.current?.click()}>
        <Box sx={{
          width: 56, height: 56, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          bgcolor: "#FEF3C7", border: "2px solid #F59E0B",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {photo
            ? <Box component="img" src={photo} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <AddPhotoAlternateIcon sx={{ fontSize: 24, color: "#92400E" }} />}
        </Box>
        <Box>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.85rem", color: "#92400E" }}>
            {photo ? "Photo attached — shown on their birthday wall" : "Attach their photo (optional)"}
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.72rem", color: "#B45309", mt: 0.3 }}>
            Displayed on their public birthday wall for everyone to see
          </Typography>
        </Box>
        <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhoto} />
      </Box>

      {/* Tribute */}
      <Typography sx={labelSx}>YOUR TRIBUTE — TELL THEIR STORY *</Typography>
      <TextField fullWidth multiline minRows={7} maxRows={20}
        placeholder={
          `Write freely about ${toName || "them"}. Their journey, your favourite memories, what makes them extraordinary, what you wish for their future.\n\nNo limit — the more you share, the more personal and powerful the call will be.`
        }
        value={tribute}
        onChange={e => { setTribute(e.target.value); setErrors(v => ({ ...v, tribute: "" })); }}
        error={!!errors.tribute}
        helperText={errors.tribute || tribute.length + " characters — write as much as you want, AI will distil the essence"}
        sx={{ ...fieldSx, mb: 3.5 }} />

      <Button fullWidth variant="contained" onClick={handleNext} sx={primaryBtnSx}>
        Continue — Add contact & schedule →
      </Button>

      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} sx={{ fontFamily: SERIF, fontWeight: 600 }}>{snack.msg}</Alert>
      </Snackbar>
    </PageShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 2 — Schedule the Call
// ═══════════════════════════════════════════════════════════════════════════════
const PageSchedule: React.FC<{
  toName: string;
  onNext: (d: ScheduleData) => void;
  onBack: () => void;
  onClose: () => void;
}> = ({ toName, onNext, onBack, onClose }) => {
  const [phone,        setPhone]        = useState("");
  const [date,         setDate]         = useState("");
  const [time,         setTime]         = useState("09:00");
  const [vibe,         setVibe]         = useState<Vibe>("heartfelt");
  const [memory,       setMemory]       = useState("");
  const [appreciation, setAppreciation] = useState("");
  const [achievement,  setAchievement]  = useState("");
  const [video,        setVideo]        = useState("");
  const [errors,       setErrors]       = useState<Record<string, string>>({});
  const videoRef = useRef<HTMLInputElement>(null);

  const QUICK_TIMES = ["07:00", "09:00", "12:00", "15:00", "18:00", "20:00"];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) e.phone = "Enter a valid phone number";
    if (!date) e.date = "Pick their birthday date";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { alert("Video must be under 50 MB"); return; }
    setVideo(file.name);
    e.target.value = "";
  };

  const handleNext = () => {
    if (validate()) onNext({ phone, date, time, vibe, memory, appreciation, achievement, video });
  };

  const activeVibe = VIBES.find(v => v.value === vibe)!;
  const todayStr   = new Date().toISOString().split("T")[0];

  return (
    <PageShell page="schedule" onClose={onClose}>

      <Box sx={{ mb: 5 }}>
        <Button variant="outlined" onClick={onBack} size="small"
          sx={{ ...ghostBtnSx, mb: 3, fontSize: "0.8rem" }}>
          Back
        </Button>
        <Typography sx={{
          fontFamily: SERIF, fontWeight: 900,
          fontSize: { xs: "1.7rem", sm: "2.2rem" },
          color: "#1a1207", lineHeight: 1.2, mb: 1,
        }}>
          Schedule the{" "}
          <Box component="span" sx={{
            background: "linear-gradient(135deg,#c9a84c,#e8c870,#c9a84c)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            magic call
          </Box>
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: "0.9rem", color: "#6B7280", lineHeight: 1.8 }}>
          We'll call {toName || "them"} at exactly the right moment — with your voice of love.
        </Typography>
      </Box>

      {/* Phone + date */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2.5 }}>
        <Box>
          <Typography sx={labelSx}>THEIR PHONE NUMBER *</Typography>
          <TextField fullWidth size="small" placeholder="+256 700 000 000" type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); setErrors(v => ({ ...v, phone: "" })); }}
            error={!!errors.phone} helperText={errors.phone} sx={fieldSx} />
        </Box>
        <Box>
          <Typography sx={labelSx}>BIRTHDAY DATE *</Typography>
          <TextField fullWidth size="small" type="date"
            inputProps={{ min: todayStr }}
            value={date}
            onChange={e => { setDate(e.target.value); setErrors(v => ({ ...v, date: "" })); }}
            error={!!errors.date} helperText={errors.date} sx={fieldSx} />
        </Box>
      </Box>

      {/* Call time */}
      <Typography sx={labelSx}>PREFERRED CALL TIME</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 2.5, alignItems: "center" }}>
        {QUICK_TIMES.map(t => (
          <Chip key={t} label={t} size="small"
            onClick={() => setTime(t)}
            sx={{
              fontFamily: SERIF, fontWeight: 700, fontSize: "0.78rem",
              cursor: "pointer", borderRadius: "20px",
              bgcolor:     time === t ? "rgba(245,158,11,0.12)" : "#F9FAFB",
              color:       time === t ? "#92400E" : "#6B7280",
              border:      "1px solid",
              borderColor: time === t ? "rgba(245,158,11,0.5)" : "#E5E7EB",
              transition: "all 0.15s",
              "&:hover": { borderColor: "#F59E0B", bgcolor: "rgba(245,158,11,0.08)" },
            }} />
        ))}
        <TextField size="small" type="time" value={time}
          onChange={e => setTime(e.target.value)}
          sx={{ ...fieldSx, width: 120 }} />
      </Box>

      {/* Vibe */}
      <Typography sx={labelSx}>CALL VIBE</Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, mb: 2.5 }}>
        {VIBES.map(v => (
          <Box key={v.value} onClick={() => setVibe(v.value)} sx={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 0.5, py: 1.5, borderRadius: "12px", cursor: "pointer",
            border: "1px solid", transition: "all 0.15s",
            borderColor: vibe === v.value ? v.color : "#E5E7EB",
            bgcolor:     vibe === v.value ? v.color + "10" : "#F9FAFB",
          }}>
            <Typography sx={{ fontSize: "1.3rem", lineHeight: 1 }}>{v.emoji}</Typography>
            <Typography sx={{
              fontFamily: SERIF, fontSize: "0.7rem", fontWeight: 700,
              color: vibe === v.value ? v.color : "#6B7280",
            }}>
              {v.label}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Memory */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.6 }}>
          <FavoriteIcon sx={{ fontSize: 13, color: "#e11d48" }} />
          <Typography sx={labelSx}>A MEMORY YOU SHARE (optional)</Typography>
        </Box>
        <TextField fullWidth multiline minRows={2}
          placeholder={"Remember when we... — this will make " + (toName || "them") + " cry happy tears"}
          value={memory} onChange={e => setMemory(e.target.value)} sx={fieldSx} />
      </Box>

      {/* Appreciation */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.6 }}>
          <EmojiEmotionsIcon sx={{ fontSize: 13, color: "#F59E0B" }} />
          <Typography sx={labelSx}>WHAT YOU APPRECIATE ABOUT THEM (optional)</Typography>
        </Box>
        <TextField fullWidth multiline minRows={2}
          placeholder={"What makes " + (toName || "them") + " special to you?"}
          value={appreciation} onChange={e => setAppreciation(e.target.value)} sx={fieldSx} />
      </Box>

      {/* Achievement */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={labelSx}>ACHIEVEMENT THIS YEAR (optional)</Typography>
        <TextField fullWidth size="small"
          placeholder="Graduated, started a business, became a parent..."
          value={achievement} onChange={e => setAchievement(e.target.value)} sx={fieldSx} />
      </Box>

      {/* Video upload */}
      <Typography sx={labelSx}>ATTACH A VIDEO MESSAGE (optional)</Typography>
      <Box sx={{
        display: "flex", alignItems: "center", gap: 2, p: 2, mb: 3,
        border: "1.5px dashed #E5E7EB", borderRadius: "14px",
        bgcolor: "#F9FAFB", cursor: "pointer",
        "&:hover": { borderColor: "#D1D5DB" }, transition: "border-color 0.2s",
      }} onClick={() => videoRef.current?.click()}>
        <Typography sx={{ fontSize: "1.8rem" }}>🎥</Typography>
        <Box>
          <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem", color: "#374151" }}>
            {video ? "✓ " + video : "Upload a video message"}
          </Typography>
          <Typography sx={{ fontFamily: SERIF, fontSize: "0.7rem", color: "#9CA3AF", mt: 0.2 }}>
            Posted on their birthday wall · Max 50 MB · MP4, MOV, WebM
          </Typography>
        </Box>
        <input ref={videoRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideo} />
      </Box>

      {/* Call preview */}
      <Box sx={{
        p: 2.5, mb: 3.5, borderRadius: "14px",
        bgcolor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
      }}>
        <Typography sx={{
          fontFamily: SERIF, fontSize: "0.7rem", fontWeight: 700,
          color: "#B45309", letterSpacing: "0.08em", mb: 1,
        }}>
          CALL PREVIEW
        </Typography>
        <Typography sx={{ fontFamily: SERIF, fontSize: "0.85rem", color: "#374151", lineHeight: 1.8 }}>
          AI will call{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "#1a1207" }}>{phone || "them"}</Box>
          {" "}on{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "#1a1207" }}>{date || "their birthday"}</Box>
          {" "}at{" "}
          <Box component="span" sx={{ fontWeight: 700, color: "#92400E" }}>{time}</Box>
          {" "}and deliver a {activeVibe.emoji} {activeVibe.label.toLowerCase()} spoken message — crafted entirely from your tribute.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button variant="outlined" onClick={onBack} sx={{ ...ghostBtnSx, flex: 1, py: 1.3 }}>
          Back
        </Button>
        <Button variant="contained" onClick={handleNext}
          startIcon={<AutoAwesomeIcon sx={{ fontSize: "16px !important" }} />}
          sx={{ ...primaryBtnSx, flex: 2 }}>
          Generate & Schedule Call
        </Button>
      </Box>
    </PageShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 3 — AI Processing
// ═══════════════════════════════════════════════════════════════════════════════
const PageProcessing: React.FC<{
  data: TributeData & ScheduleData;
  onDone: (summary: string) => void;
  onClose: () => void;
}> = ({ data, onDone, onClose }) => {
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [summary,  setSummary]  = useState("");
  const [done,     setDone]     = useState(false);

  // ── FIX: no template literal here — avoids the stray-backtick TS parse error
  const STAGES = [
    "Reading your tribute...",
    "Finding the most emotional moments...",
    "Crafting the spoken message...",
    "Adding that " + data.vibe + " touch...",
    "Scheduling the call...",
    "All done!",
  ];

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      for (let i = 0; i < STAGES.length; i++) {
        if (cancelled) return;
        setStageIdx(i);
        setProgress(Math.round((i / (STAGES.length - 1)) * 100));
        await new Promise(r => setTimeout(r, 850));
      }

      let text = "";
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{
              role: "user",
              content:
                "You are crafting a warm, emotional spoken birthday message to be read aloud over a phone call.\n\n" +
                data.fromName + " (" + (data.relation || "a loved one") + ") wrote this tribute about " + data.toName + ":\n\n" +
                "---\n" + data.tribute + "\n---\n\n" +
                (data.memory       ? "Shared memory: "          + data.memory       + "\n" : "") +
                (data.appreciation ? "What they appreciate: "   + data.appreciation + "\n" : "") +
                (data.achievement  ? "Achievement this year: "  + data.achievement  + "\n" : "") +
                "\nWrite a " + data.vibe + " spoken message (80-120 words). Speak directly as " +
                data.fromName + " to " + data.toName + ". Use natural spoken language. " +
                "Start with \"Happy Birthday\" and end with something that leaves them speechless. " +
                "Return ONLY the spoken message.",
            }],
          }),
        });
        const json = await res.json();
        text = json.content?.find((c: { type: string }) => c.type === "text")?.text ?? "";
      } catch {
        text =
          "Happy Birthday, " + data.toName + "! " +
          data.fromName + " wanted me to call you today because you are so deeply loved. " +
          "Every moment you've shared, every memory you've built — it all matters more than you know. " +
          "May this year bring you everything your heart deserves. You are extraordinary.";
      }

      if (!cancelled) {
        setSummary(text);
        setDone(true);
      }
    };

    run();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (done && summary) onDone(summary);
  }, [done, summary, onDone]);

  return (
    <PageShell page="processing" onClose={onClose}>
      <Box sx={{
        display: "flex", flexDirection: "column",
        alignItems: "center", textAlign: "center", py: 6,
      }}>

        {/* Spinner / done icon */}
        <Box sx={{
          width: 100, height: 100, borderRadius: "50%",
          border: done ? "2px solid rgba(245,158,11,0.35)" : "3px solid #FDE68A",
          borderTopColor: done ? "rgba(245,158,11,0.35)" : "#F59E0B",
          display: "flex", alignItems: "center", justifyContent: "center",
          bgcolor: done ? "rgba(245,158,11,0.08)" : "transparent",
          mb: 4,
          ...(done ? {} : {
            "@keyframes spin": { to: { transform: "rotate(360deg)" } },
            animation: "spin 0.9s linear infinite",
          }),
        }}>
          {done && <CheckCircleIcon sx={{ fontSize: 48, color: "#F59E0B" }} />}
        </Box>

        <Typography sx={{
          fontFamily: SERIF, fontWeight: 900, fontSize: "2rem", color: "#1a1207", mb: 1.5,
        }}>
          {done
            ? <Box component="span" sx={{
                background: "linear-gradient(135deg,#c9a84c,#e8c870,#c9a84c)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Call scheduled! 🎉
              </Box>
            : "Working the magic..."
          }
        </Typography>

        <Typography sx={{ fontFamily: SERIF, fontSize: "0.9rem", color: "#6B7280", mb: 4 }}>
          {STAGES[stageIdx]}
        </Typography>

        <Box sx={{ width: "100%", maxWidth: 440, mb: 5 }}>
          <LinearProgress variant="determinate" value={progress} sx={{
            height: 8, borderRadius: 4, bgcolor: "#FEF3C7",
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(90deg,#F59E0B,#FBBF24)",
              borderRadius: 4,
            },
          }} />
        </Box>

        {summary && (
          <Box sx={{
            p: 3, borderRadius: "16px", textAlign: "left", maxWidth: 520,
            bgcolor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
          }}>
            <Typography sx={{
              fontFamily: SERIF, fontSize: "0.7rem", fontWeight: 700,
              color: "#B45309", letterSpacing: "0.1em", mb: 1.5,
            }}>
              AI-GENERATED SPOKEN MESSAGE PREVIEW
            </Typography>
            <Typography sx={{
              fontFamily: SERIF, fontSize: "0.9rem",
              color: "#374151", lineHeight: 1.9, fontStyle: "italic",
            }}>
              "{summary}"
            </Typography>
          </Box>
        )}
      </Box>
    </PageShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE 4 — Birthday Wall
// ═══════════════════════════════════════════════════════════════════════════════
const PageWall: React.FC<{
  data: AllData;
  onClose: () => void;
  onReset: () => void;
}> = ({ data, onClose, onReset }) => {
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    "❤️": 12, "🙏": 5, "🎉": 8, "🌟": 3, "🥰": 7, "😭": 4,
  });
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [comments,   setComments]   = useState([
    { name: "Mama Rose", text: "God bless you always sweetheart 🙏❤️", time: "2m ago" },
    { name: "Uncle Ben",  text: "Happy birthday! Wishing you a year full of blessings!", time: "5m ago" },
  ]);
  const [newComment, setNewComment] = useState("");
  const [commenter,  setCommenter]  = useState("");
  const [snack,      setSnack]      = useState({ open: false, msg: "", severity: "success" as "success" | "error" });

  const activeVibe = VIBES.find(v => v.value === data.vibe) ?? VIBES[0];

  const react = (emoji: string) => {
    setReactionCounts(prev => {
      const next = { ...prev };
      if (myReaction) next[myReaction] = Math.max(0, (next[myReaction] ?? 0) - 1);
      if (myReaction !== emoji) {
        next[emoji] = (next[emoji] ?? 0) + 1;
        setMyReaction(emoji);
      } else {
        setMyReaction(null);
      }
      return next;
    });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [{
      name: commenter.trim() || "A friend",
      text: newComment.trim(),
      time: "just now",
    }, ...prev]);
    setNewComment("");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).then(() =>
      setSnack({ open: true, msg: "Wall link copied! Share it with everyone 🎂", severity: "success" })
    );
  };

  return (
    <PageShell page="wall" onClose={onClose}>

      {/* Hero tribute card */}
      <Box sx={{
        borderRadius: "20px", overflow: "hidden", mb: 3,
        bgcolor: "#1a0f00", boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        border: "1px solid rgba(201,168,76,0.25)",
      }}>
        <Box sx={{ height: 4, background: "linear-gradient(90deg,#c9a84c,#e8c870,#c9a84c)" }} />

        <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
          {/* Avatar + name */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 3.5 }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: "50%", overflow: "hidden",
              border: "2.5px solid #c9a84c", flexShrink: 0,
              bgcolor: "rgba(201,168,76,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {data.photo
                ? <Box component="img" src={data.photo} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <Typography sx={{ fontSize: "2rem" }}>🎂</Typography>}
            </Box>
            <Box>
              <Typography sx={{
                fontFamily: SERIF, fontSize: "0.7rem", fontWeight: 700,
                color: "rgba(201,168,76,0.6)", letterSpacing: "0.1em", mb: 0.5,
              }}>
                BIRTHDAY WISH FROM {data.fromName?.toUpperCase()}
              </Typography>
              <Typography sx={{
                fontFamily: SERIF, fontWeight: 900,
                fontSize: { xs: "1.5rem", sm: "2rem" },
                color: "#fff", lineHeight: 1.15,
              }}>
                Happy Birthday,{" "}
                <Box component="span" sx={{
                  background: "linear-gradient(135deg,#c9a84c,#e8c870,#c9a84c)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>
                  {data.toName}!
                </Box>
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                {data.relation && (
                  <Box sx={{
                    px: 1.5, py: 0.4, borderRadius: "20px",
                    bgcolor: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                  }}>
                    <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem", fontWeight: 700, color: "#c9a84c" }}>
                      {data.relation}
                    </Typography>
                  </Box>
                )}
                <Box sx={{
                  px: 1.5, py: 0.4, borderRadius: "20px",
                  bgcolor: activeVibe.color + "18", border: "1px solid " + activeVibe.color + "30",
                }}>
                  <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem", fontWeight: 700, color: activeVibe.color }}>
                    {activeVibe.emoji} {activeVibe.label}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Tribute text */}
          <Box sx={{ borderLeft: "3px solid rgba(201,168,76,0.3)", pl: 2.5, mb: 3 }}>
            {data.tribute.split("\n").filter(p => p.trim()).map((para, i) => (
              <Typography key={i} sx={{
                fontFamily: SERIF, fontStyle: "italic", fontSize: "0.9rem",
                color: "rgba(240,234,216,0.8)", lineHeight: 1.9, mb: 1.5,
              }}>
                {para}
              </Typography>
            ))}
          </Box>

          {/* AI spoken message */}
          {data.summary && (
            <Box sx={{
              p: 2.5, borderRadius: "12px", mb: 2.5,
              bgcolor: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)",
            }}>
              <Typography sx={{
                fontFamily: SERIF, fontSize: "0.68rem", fontWeight: 700,
                color: "rgba(201,168,76,0.6)", letterSpacing: "0.1em", mb: 1,
              }}>
                AI VOICE MESSAGE DELIVERED
              </Typography>
              <Typography sx={{
                fontFamily: SERIF, fontSize: "0.85rem",
                color: "rgba(240,234,216,0.7)", lineHeight: 1.9, fontStyle: "italic",
              }}>
                "{data.summary}"
              </Typography>
            </Box>
          )}

          {/* Call status */}
          <Box sx={{
            display: "flex", alignItems: "center", gap: 1.5, p: 1.8,
            borderRadius: "10px", bgcolor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
          }}>
            <Typography sx={{ fontSize: "1.1rem" }}>📞</Typography>
            <Typography sx={{ fontFamily: SERIF, fontSize: "0.8rem", color: "rgba(240,234,216,0.7)" }}>
              Call scheduled for{" "}
              <Box component="span" sx={{ fontWeight: 700, color: "#34d399" }}>
                {data.date || "their birthday"} at {data.time || "09:00"}
              </Box>
              {" "}— {data.toName} will receive this message
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Reactions */}
      <Box sx={{
        p: 2.5, borderRadius: "16px", mb: 2.5,
        bgcolor: "#fff", border: "1px solid #F3F4F6",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}>
        <Typography sx={labelSx}>REACT TO THIS WISH</Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          {REACTIONS.map(emoji => (
            <Box key={emoji} onClick={() => react(emoji)} sx={{
              display: "flex", alignItems: "center", gap: 0.8,
              px: 1.5, py: 0.8, borderRadius: "24px", cursor: "pointer",
              border: "1px solid",
              borderColor: myReaction === emoji ? "rgba(245,158,11,0.5)" : "#E5E7EB",
              bgcolor:     myReaction === emoji ? "rgba(245,158,11,0.1)" : "#F9FAFB",
              transition: "all 0.15s",
              "&:hover": { borderColor: "#F59E0B", bgcolor: "rgba(245,158,11,0.06)" },
            }}>
              <Typography sx={{ fontSize: "1.1rem", lineHeight: 1 }}>{emoji}</Typography>
              <Typography sx={{
                fontFamily: SERIF, fontSize: "0.78rem", fontWeight: 700,
                color: myReaction === emoji ? "#92400E" : "#6B7280",
              }}>
                {reactionCounts[emoji] ?? 0}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Comments */}
      <Box sx={{
        borderRadius: "16px", overflow: "hidden",
        bgcolor: "#fff", border: "1px solid #F3F4F6",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)", mb: 3,
      }}>
        <Box sx={{ px: 3, py: 2, borderBottom: "1px solid #F3F4F6" }}>
          <Typography sx={labelSx}>BIRTHDAY MESSAGES ({comments.length})</Typography>
        </Box>

        {/* Add comment */}
        <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid #F9FAFB" }}>
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 2fr" },
            gap: 1.5, mb: 1.5,
          }}>
            <TextField size="small" placeholder="Your name"
              value={commenter} onChange={e => setCommenter(e.target.value)} sx={fieldSx} />
            <TextField size="small" multiline minRows={1} maxRows={3}
              placeholder={"Leave a birthday message for " + data.toName + "..."}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addComment(); } }}
              sx={fieldSx} />
          </Box>
          <Button variant="contained" onClick={addComment}
            sx={{ ...primaryBtnSx, py: 0.9, fontSize: "0.82rem" }}>
            Post Message 🎉
          </Button>
        </Box>

        {/* Comment list */}
        {comments.map((c, i) => (
          <Box key={i} sx={{
            display: "flex", gap: 1.8, px: 3, py: 2,
            borderBottom: i < comments.length - 1 ? "1px solid #F9FAFB" : "none",
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              bgcolor: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.8rem", color: "#92400E" }}>
                {c.name[0].toUpperCase()}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 0.4 }}>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: "0.82rem", color: "#1a1207" }}>
                  {c.name}
                </Typography>
                <Typography sx={{ fontFamily: SERIF, fontSize: "0.68rem", color: "#9CA3AF" }}>
                  {c.time}
                </Typography>
              </Box>
              <Typography sx={{ fontFamily: SERIF, fontSize: "0.85rem", color: "#374151", lineHeight: 1.7 }}>
                {c.text}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Footer actions */}
      <Box sx={{ display: "flex", gap: 1.5 }}>
        <Button variant="outlined" onClick={handleCopy}
          startIcon={<ContentCopyIcon sx={{ fontSize: "16px !important" }} />}
          sx={{ ...ghostBtnSx, flex: 1, py: 1.2 }}>
          Copy Wall Link
        </Button>
        <Button variant="contained" onClick={onReset}
          sx={{ ...primaryBtnSx, flex: 1, py: 1.2 }}>
          🎂 Wish Someone Else
        </Button>
      </Box>

      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} sx={{ fontFamily: SERIF, fontWeight: 600 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </PageShell>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT — WishComposer
// ═══════════════════════════════════════════════════════════════════════════════
const WishComposer: React.FC<WishComposerProps> = ({ onClose }) => {
  const [page,    setPage]    = useState<Page>("tribute");
  const [payload, setPayload] = useState<Partial<AllData>>({});

  const handleTributeNext = (d: TributeData) => {
    setPayload(d);
    setPage("schedule");
  };

  const handleScheduleNext = (d: ScheduleData) => {
    setPayload(prev => ({ ...prev, ...d }));
    setPage("processing");
  };

  const handleProcessingDone = (summary: string) => {
    setPayload(prev => ({ ...prev, summary }));
    setPage("wall");
  };

  const handleReset = () => {
    setPayload({});
    setPage("tribute");
  };

  if (page === "tribute")
    return <PageTribute onNext={handleTributeNext} onClose={onClose} />;

  if (page === "schedule")
    return (
      <PageSchedule
        toName={payload.toName ?? ""}
        onNext={handleScheduleNext}
        onBack={() => setPage("tribute")}
        onClose={onClose}
      />
    );

  if (page === "processing")
    return (
      <PageProcessing
        data={payload as TributeData & ScheduleData}
        onDone={handleProcessingDone}
        onClose={onClose}
      />
    );

  if (page === "wall")
    return (
      <PageWall
        data={payload as AllData}
        onClose={onClose}
        onReset={handleReset}
      />
    );

  return null;
};

export default WishComposer;