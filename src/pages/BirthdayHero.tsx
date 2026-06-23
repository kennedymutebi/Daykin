import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { keyframes } from "@emotion/react";
import {
  Box, Typography, Button, Select, MenuItem, IconButton, TextField,
  InputAdornment, Chip, Divider, Collapse, Avatar,
  Dialog, DialogContent, DialogActions,
  Snackbar, Alert, Badge, Tooltip,
} from "@mui/material";
import CakeIcon          from "@mui/icons-material/Cake";
import FavoriteIcon      from "@mui/icons-material/Favorite";
import ChevronLeftIcon   from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon  from "@mui/icons-material/ChevronRight";
import SearchIcon        from "@mui/icons-material/Search";
import PersonSearchIcon  from "@mui/icons-material/PersonSearch";
import CelebrationIcon   from "@mui/icons-material/Celebration";
import StarIcon          from "@mui/icons-material/Star";
import CloseIcon         from "@mui/icons-material/Close";
import CheckCircleIcon   from "@mui/icons-material/CheckCircle";
import CancelIcon        from "@mui/icons-material/Cancel";
import PersonAddIcon     from "@mui/icons-material/PersonAdd";
import SendIcon          from "@mui/icons-material/Send";
import InboxIcon         from "@mui/icons-material/Inbox";
import {
  FONT, SOUL, RADIUS, containerSx, glassSx, dialogPaperSx,
  goldButtonSx, ghostButtonSx, pillToggleSx, fieldSx, selectSx,
  menuPaperSx, labelSx, avatarRingSx, GOLD, GOLD2,
} from "./soulwishTheme";

export { GOLD, GOLD2 };

// ── Static data ────────────────────────────────────────────────────────────
export const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
export const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0"));

export interface BirthdayPerson {
  id: number;
  name: string;
  location: string;
  photo: string;
  wishMessage: string;
  birthMonth?: string;
  birthDay?: string;
  addedBy?: string; // "self" | "friend" | "admin"
}

export interface WishEntry {
  id: string;
  fromName: string;
  message: string;
  timestamp: Date;
  recipientId: number;
}

export const TODAY_BIRTHDAYS: BirthdayPerson[] = [
  { id: 1, name: "Kennedy Mutebi",  location: "Kampala, Uganda", photo: "/birthday.jpg", wishMessage: "Wishing you a day as bright as your smile!",                          birthMonth: "June",    birthDay: "07", addedBy: "admin"  },
  { id: 2, name: "Grace Nakato",    location: "Entebbe, Uganda", photo: "/person1.jpg",  wishMessage: "May this birthday be the start of something wonderful!",              birthMonth: "June",    birthDay: "07", addedBy: "self"   },
  { id: 3, name: "Brian Ssebuliba", location: "Jinja, Uganda",   photo: "/person2.jpg",  wishMessage: "Another year of greatness ahead — happy birthday!",                  birthMonth: "March",   birthDay: "15", addedBy: "friend" },
  { id: 4, name: "Amara Diallo",    location: "Nairobi, Kenya",  photo: "/person3.jpg",  wishMessage: "Celebrate big today!",                                               birthMonth: "January", birthDay: "20", addedBy: "self"   },
  { id: 5, name: "Priya Sharma",    location: "Nairobi, Kenya",  photo: "/person2.jpg",  wishMessage: "Here's to everything this new year brings — happy birthday!",        birthMonth: "August",  birthDay: "03", addedBy: "friend" },
];

export const FAMOUS_MATCHES = [
  { id: 1, name: "Beyoncé",         born: "Sep 4",  category: "Music",  image: "/beyonce.jpg",   fact: "Singer, songwriter, actress — one of the best-selling music artists of all time." },
  { id: 2, name: "Michael Jackson", born: "Aug 29", category: "Music",  image: "/mj.png",        fact: "King of Pop, sold over 400 million records worldwide." },
  { id: 3, name: "Selena Gomez",    born: "Jul 22", category: "Music",  image: "/gomez.jpg",     fact: "Pop star, actress, and one of the most-followed people on Instagram." },
  { id: 4, name: "LeBron James",    born: "Dec 30", category: "Sports", image: "/lebron.jpg",    fact: "4× NBA champion, widely regarded as the greatest basketball player of his era." },
  { id: 5, name: "Adele",           born: "May 5",  category: "Music",  image: "/adele.jpg",     fact: "Grammy-winning British singer whose albums have broken multiple world records." },
  { id: 6, name: "Elon Musk",       born: "Jun 28", category: "Tech",   image: "/elonemask.jpg", fact: "CEO of Tesla and SpaceX, has fundamentally changed electric vehicles and space travel." },
];

// ── Animations ─────────────────────────────────────────────────────────────
export const fadeSlideUp   = keyframes`from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)}`;
export const fadeSlideDown = keyframes`from{opacity:0;transform:translateY(-16px)} to{opacity:1;transform:translateY(0)}`;

// ── Shared sub-components ──────────────────────────────────────────────────
const ModalHeader: React.FC<{
  avatar?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
}> = ({ avatar, title, subtitle, onClose }) => (
  <Box sx={{ borderBottom: `1px solid ${SOUL.border}`, px: 3, py: 2.4, display: "flex", alignItems: "center", gap: 1.5 }}>
    {avatar}
    <Box flex={1}>
      <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "1.05rem", color: SOUL.text }}>{title}</Typography>
      {subtitle && <Typography sx={{ fontFamily: FONT, fontSize: "0.75rem", color: SOUL.textMuted, mt: 0.2 }}>{subtitle}</Typography>}
    </Box>
    <IconButton onClick={onClose} sx={{ color: SOUL.textMuted, "&:hover": { color: SOUL.text } }}>
      <CloseIcon fontSize="small" />
    </IconButton>
  </Box>
);

const SuccessPanel: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  onDone: () => void;
}> = ({ icon, title, description, onDone }) => (
  <>
    <DialogContent sx={{ textAlign: "center", py: 5 }}>
      <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "rgba(90,200,106,0.15)", border: "2px solid rgba(90,200,106,0.4)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
        {icon}
      </Box>
      <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "1.2rem", color: SOUL.text, mb: 1 }}>{title}</Typography>
      <Typography sx={{ fontFamily: FONT, fontSize: "0.85rem", color: SOUL.textMuted, lineHeight: 1.6 }}>{description}</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 3 }}>
      <Button fullWidth variant="contained" onClick={onDone} sx={goldButtonSx()}>Done</Button>
    </DialogActions>
  </>
);

const ErrorText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontFamily: FONT, fontSize: "0.7rem", color: SOUL.error, mb: 1.5 }}>{children}</Typography>
);

const Placeholder: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: SOUL.textFaint }}>{children}</span>
);

// ── WishModal ──────────────────────────────────────────────────────────────
interface WishModalProps {
  open: boolean;
  person: BirthdayPerson | null;
  onClose: () => void;
  onSubmit: (wish: WishEntry) => void;
}

export const WishModal: React.FC<WishModalProps> = ({ open, person, onClose, onSubmit }) => {
  const [senderName, setSenderName] = useState("");
  const [message,    setMessage]    = useState("");
  const [submitted,  setSubmitted]  = useState(false);

  useEffect(() => {
    if (!open) setTimeout(() => { setSenderName(""); setMessage(""); setSubmitted(false); }, 300);
  }, [open]);

  if (!person) return null;

  const handleSend = () => {
    if (!senderName.trim() || !message.trim()) return;
    onSubmit({ id: `wish_${Date.now()}`, fromName: senderName.trim(), message: message.trim(), timestamp: new Date(), recipientId: person.id });
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: dialogPaperSx }}>
      <ModalHeader
        onClose={onClose}
        avatar={<Avatar src={person.photo} sx={avatarRingSx(56)}>{person.name.charAt(0)}</Avatar>}
        title={`🎂 Wish ${person.name}`}
        subtitle={`${person.location}${person.birthMonth ? ` · Born ${person.birthMonth} ${person.birthDay}` : ""}`}
      />
      {submitted ? (
        <SuccessPanel
          icon={<CheckCircleIcon sx={{ fontSize: 32, color: SOUL.success }} />}
          title="Wish Sent! 🎉"
          description={<>Your wish has been delivered to <strong style={{ color: SOUL.text }}>{person.name}</strong>. They'll see it in their birthday inbox.</>}
          onDone={onClose}
        />
      ) : (
        <>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Box sx={{ ...glassSx(RADIUS.md), bgcolor: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.20)", px: 2, py: 1.5, mb: 2.5 }}>
              <Box display="flex" alignItems="center" gap={0.8} mb={0.5}>
                <FavoriteIcon sx={{ fontSize: 13, color: SOUL.gold }} />
                <Typography sx={{ ...labelSx, fontSize: "0.65rem" }}>THEIR BIRTHDAY WISH</Typography>
              </Box>
              <Typography sx={{ fontFamily: FONT, fontSize: "0.85rem", color: SOUL.textMuted, fontStyle: "italic" }}>"{person.wishMessage}"</Typography>
            </Box>

            <Typography sx={{ ...labelSx, mb: 0.8 }}>YOUR NAME</Typography>
            <TextField fullWidth size="small" placeholder="e.g. Sarah Nalwoga" value={senderName} onChange={e => setSenderName(e.target.value)} sx={{ mb: 2.2, ...fieldSx() }} />

            <Typography sx={{ ...labelSx, mb: 0.8 }}>YOUR WISH MESSAGE</Typography>
            <TextField fullWidth multiline rows={4} placeholder={`Write a birthday wish for ${person.name.split(" ")[0]}…`} value={message} onChange={e => setMessage(e.target.value)} inputProps={{ maxLength: 280 }} sx={fieldSx()} />
            <Typography sx={{ fontFamily: FONT, fontSize: "0.68rem", color: SOUL.textFaint, textAlign: "right", mt: 0.5 }}>{message.length}/280</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={onClose} sx={{ fontFamily: FONT, fontWeight: 700, color: SOUL.textMuted, textTransform: "none", "&:hover": { color: SOUL.text } }}>Cancel</Button>
            <Button variant="contained" onClick={handleSend} disabled={!senderName.trim() || !message.trim()} endIcon={<SendIcon sx={{ fontSize: "16px !important" }} />} sx={{ ...goldButtonSx(), flex: 1 }}>
              Send Wish
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

// ── WishInboxModal ─────────────────────────────────────────────────────────
interface WishInboxModalProps {
  open: boolean;
  person: BirthdayPerson | null;
  wishes: WishEntry[];
  onClose: () => void;
}

export const WishInboxModal: React.FC<WishInboxModalProps> = ({ open, person, wishes, onClose }) => {
  if (!person) return null;
  const myWishes = wishes.filter(w => w.recipientId === person.id);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { ...dialogPaperSx, maxHeight: "80vh" } }}>
      <ModalHeader
        onClose={onClose}
        avatar={<Avatar src={person.photo} sx={avatarRingSx(44)}>{person.name.charAt(0)}</Avatar>}
        title="Birthday Wishes"
        subtitle={`${person.name} · ${myWishes.length} ${myWishes.length === 1 ? "wish" : "wishes"} received`}
      />
      <DialogContent sx={{ px: 3, py: 2.5 }}>
        {myWishes.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <InboxIcon sx={{ fontSize: 40, color: SOUL.textFaint, mb: 1.5, display: "block", mx: "auto" }} />
            <Typography sx={{ fontFamily: FONT, fontSize: "0.9rem", color: SOUL.textFaint }}>
              No wishes yet — be the first to wish {person.name.split(" ")[0]}!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {myWishes.map((wish, idx) => (
              <Box key={wish.id} sx={{ bgcolor: "rgba(255,255,255,0.05)", border: `1px solid ${SOUL.border}`, borderRadius: `${RADIUS.md}px`, px: 2.2, py: 1.8, animation: `${fadeSlideUp} 0.4s ${idx * 0.08}s both` }}>
                <Box display="flex" alignItems="center" gap={1} mb={0.8}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: `rgba(245,166,35,${0.15 + (idx % 3) * 0.1})`, fontFamily: FONT, fontWeight: 800, fontSize: "0.72rem", color: SOUL.gold }}>
                    {wish.fromName.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "0.85rem", color: SOUL.text }}>{wish.fromName}</Typography>
                  <Typography sx={{ fontFamily: FONT, fontSize: "0.68rem", color: SOUL.textFaint, ml: "auto" }}>
                    {wish.timestamp.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </Typography>
                </Box>
                <Typography sx={{ fontFamily: FONT, fontSize: "0.88rem", color: SOUL.textMuted, lineHeight: 1.6, fontStyle: "italic" }}>"{wish.message}"</Typography>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── RegisterModal ──────────────────────────────────────────────────────────
interface RegisterModalProps {
  open: boolean;
  onClose: () => void;
  onRegister: (person: Omit<BirthdayPerson, "id">) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ open, onClose, onRegister }) => {
  const [name,       setName]       = useState("");
  const [location,   setLocation]   = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay,   setBirthDay]   = useState("");
  const [wishMsg,    setWishMsg]    = useState("");
  const [addingFor,  setAddingFor]  = useState<"self" | "friend">("self");
  const [submitted,  setSubmitted]  = useState(false);
  const [errors,     setErrors]     = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) setTimeout(() => {
      setName(""); setLocation(""); setBirthMonth(""); setBirthDay("");
      setWishMsg(""); setAddingFor("self"); setSubmitted(false); setErrors({});
    }, 300);
  }, [open]);

  const handleSubmit = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!birthMonth)  e.birthMonth = "Month is required";
    if (!birthDay)    e.birthDay   = "Day is required";
    setErrors(e);
    if (Object.keys(e).length) return;
    onRegister({
      name: name.trim(),
      location: location.trim() || "Uganda",
      photo: "",
      wishMessage: wishMsg.trim() || "Wishing everyone love and joy on my birthday!",
      birthMonth, birthDay, addedBy: addingFor,
    });
    setSubmitted(true);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { ...dialogPaperSx, maxHeight: "90vh" } }}>
      <ModalHeader
        onClose={onClose}
        avatar={
          <Box sx={{ width: 40, height: 40, borderRadius: `${RADIUS.sm}px`, bgcolor: "rgba(245,166,35,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <PersonAddIcon sx={{ color: SOUL.gold }} />
          </Box>
        }
        title="Add a Birthday"
        subtitle="Register yourself or a friend to the birthday list"
      />
      {submitted ? (
        <SuccessPanel
          icon={<CakeIcon sx={{ fontSize: 32, color: SOUL.gold }} />}
          title={addingFor === "self" ? "You're on the list! 🎉" : "They've been added! 🎁"}
          description={<><strong style={{ color: SOUL.text }}>{name}</strong> has been added to the birthday list for{" "}<strong style={{ color: SOUL.gold }}>{birthMonth} {birthDay}</strong>.</>}
          onDone={onClose}
        />
      ) : (
        <>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Box sx={{ display: "flex", gap: 1, mb: 2.5 }}>
              {(["self", "friend"] as const).map(type => (
                <Box
                  key={type}
                  onClick={() => setAddingFor(type)}
                  sx={{
                    flex: 1, textAlign: "center", cursor: "pointer",
                    borderRadius: `${RADIUS.md}px`, py: 1.2, px: 1.5,
                    border: `1.5px solid ${addingFor === type ? SOUL.gold : SOUL.border}`,
                    bgcolor: addingFor === type ? "rgba(245,166,35,0.12)" : "transparent",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "0.9rem", color: addingFor === type ? SOUL.gold : SOUL.textMuted }}>
                    {type === "self" ? "🙋 Adding myself" : "🎁 Adding a friend"}
                  </Typography>
                  <Typography sx={{ fontFamily: FONT, fontSize: "0.68rem", color: SOUL.textFaint, mt: 0.2 }}>
                    {type === "self" ? "It's my birthday!" : "I want to celebrate them"}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography sx={{ ...labelSx, mb: 0.7 }}>FULL NAME *</Typography>
            <TextField fullWidth size="small" placeholder="e.g. Kennedy Mutebi" value={name} onChange={e => setName(e.target.value)} sx={{ mb: errors.name ? 0.5 : 2, ...fieldSx(!!errors.name) }} />
            {errors.name && <ErrorText>{errors.name}</ErrorText>}

            <Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
              <Box flex={1}>
                <Typography sx={{ ...labelSx, mb: 0.7 }}>BIRTH MONTH *</Typography>
                <Select fullWidth size="small" displayEmpty value={birthMonth} onChange={e => setBirthMonth(e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }} renderValue={v => (v as string) || <Placeholder>Month</Placeholder>}>
                  {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </Select>
                {errors.birthMonth && <ErrorText>{errors.birthMonth}</ErrorText>}
              </Box>
              <Box width={110}>
                <Typography sx={{ ...labelSx, mb: 0.7 }}>DAY *</Typography>
                <Select fullWidth size="small" displayEmpty value={birthDay} onChange={e => setBirthDay(e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }} renderValue={v => (v as string) || <Placeholder>Day</Placeholder>}>
                  {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </Select>
                {errors.birthDay && <ErrorText>{errors.birthDay}</ErrorText>}
              </Box>
            </Box>

            <Typography sx={{ ...labelSx, mb: 0.7 }}>LOCATION</Typography>
            <TextField fullWidth size="small" placeholder="e.g. Kampala, Uganda" value={location} onChange={e => setLocation(e.target.value)} sx={{ mb: 2, ...fieldSx() }} />

            <Typography sx={{ ...labelSx, mb: 0.7 }}>PERSONAL BIRTHDAY MESSAGE (OPTIONAL)</Typography>
            <TextField fullWidth multiline rows={3} placeholder="A short wish message others will see on your card…" value={wishMsg} onChange={e => setWishMsg(e.target.value)} inputProps={{ maxLength: 180 }} sx={fieldSx()} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={onClose} sx={{ fontFamily: FONT, fontWeight: 700, color: SOUL.textMuted, textTransform: "none", "&:hover": { color: SOUL.text } }}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} startIcon={<PersonAddIcon sx={{ fontSize: "17px !important" }} />} sx={{ ...goldButtonSx(), flex: 1 }}>
              {addingFor === "self" ? "Add My Birthday" : "Add Their Birthday"}
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

// ── HeroBirthdayCard ───────────────────────────────────────────────────────
export const HeroBirthdayCard: React.FC<{ person: BirthdayPerson; isActive: boolean }> = ({ person, isActive }) => (
  <Box sx={{ position: "absolute", inset: 0, opacity: isActive ? 1 : 0, transition: "opacity 0.7s ease", pointerEvents: isActive ? "auto" : "none" }}>
    <Box
      component="img" src={person.photo} alt={person.name}
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", objectPosition: "center top", display: "block" }}
      onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
    />
    <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(12,12,31,0.95) 0%, rgba(17,17,37,0.55) 40%, rgba(17,17,37,0.15) 70%, rgba(17,17,37,0) 100%)" }} />

    <Box sx={{ position: "absolute", bottom: { xs: 90, md: 110 }, left: { xs: 20, md: 48 }, right: { xs: 20, md: "auto" }, maxWidth: 460, animation: isActive ? `${fadeSlideUp} 0.6s 0.3s both` : "none" }}>
      <Box sx={{ ...glassSx(RADIUS.xl), bgcolor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", px: 2.5, py: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={0.8} mb={0.8}>
          <FavoriteIcon sx={{ fontSize: 13, color: SOUL.gold }} />
          <Typography sx={{ ...labelSx, fontSize: "0.65rem" }}>BIRTHDAY WISH</Typography>
        </Box>
        <Typography sx={{ fontFamily: FONT, fontSize: { xs: "0.92rem", md: "1rem" }, color: "#fff", lineHeight: 1.65, fontStyle: "italic" }}>
          "{person.wishMessage}"
        </Typography>
      </Box>
      <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: { xs: "2rem", sm: "2.6rem", md: "3.25rem" }, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.02em", mb: 0.5, textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
        {person.name}
      </Typography>
      <Typography sx={{ fontFamily: FONT, fontSize: "0.9rem", color: "rgba(255,255,255,0.72)" }}>
        🎂 {person.location}{person.birthMonth && person.birthDay ? ` · ${person.birthMonth} ${person.birthDay}` : ""}
      </Typography>
    </Box>
  </Box>
);

// ── CelebSearchPanel ───────────────────────────────────────────────────────
interface CelebSearchPanelProps {
  month: string; day: string;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
  onSearch: () => void;
}

export const CelebSearchPanel: React.FC<CelebSearchPanelProps> = ({ month, day, onMonthChange, onDayChange, onSearch }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ position: "absolute", top: { xs: 14, md: 22 }, right: { xs: 12, md: 28 }, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
      <Button
        onClick={() => setExpanded(p => !p)}
        startIcon={<StarIcon sx={{ fontSize: "15px !important" }} />}
        endIcon={expanded ? <CloseIcon sx={{ fontSize: "14px !important" }} /> : null}
        sx={pillToggleSx(expanded)}
      >
        {expanded ? "Close" : "Who shares my birthday?"}
      </Button>

      <Collapse in={expanded} timeout={300}>
        <Box sx={{ ...glassSx(RADIUS.lg), p: 2.2, width: { xs: 290, sm: 320 }, animation: expanded ? `${fadeSlideDown} 0.3s ease both` : "none" }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.6}>
            <CelebrationIcon sx={{ fontSize: 18, color: SOUL.gold }} />
            <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "0.95rem", color: SOUL.text }}>Celebrity Birthday Match</Typography>
          </Box>
          <Typography sx={{ fontFamily: FONT, fontSize: "0.72rem", color: SOUL.textMuted, mb: 1.8, lineHeight: 1.5 }}>
            Pick a date below to discover famous people born on the same day as you.
          </Typography>
          <Divider sx={{ borderColor: SOUL.border, mb: 1.8 }} />
          <Box display="flex" gap={1} mb={1.5}>
            <Box flex={1}>
              <Typography sx={{ ...labelSx, fontSize: "0.65rem", mb: 0.5 }}>MONTH</Typography>
              <Select fullWidth size="small" displayEmpty value={month} onChange={e => onMonthChange(e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }} renderValue={v => (v as string) || <Placeholder>e.g. June</Placeholder>}>
                {MONTHS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </Box>
            <Box width={90}>
              <Typography sx={{ ...labelSx, fontSize: "0.65rem", mb: 0.5 }}>DAY</Typography>
              <Select fullWidth size="small" displayEmpty value={day} onChange={e => onDayChange(e.target.value)} sx={selectSx} MenuProps={{ PaperProps: { sx: menuPaperSx } }} renderValue={v => (v as string) || <Placeholder>01</Placeholder>}>
                {DAYS.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </Select>
            </Box>
          </Box>
          <Button fullWidth variant="contained" onClick={onSearch} disabled={!month || !day} startIcon={<SearchIcon sx={{ fontSize: "16px !important" }} />} sx={goldButtonSx("sm")}>
            Find Celebrity Matches
          </Button>
          {!month && !day && (
            <Typography sx={{ fontFamily: FONT, fontSize: "0.67rem", color: SOUL.textFaint, textAlign: "center", mt: 1 }}>
              Example: June 7 → Liam Neeson, Prince
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

// ── PersonalBirthdaySearch ─────────────────────────────────────────────────
interface PersonalBirthdaySearchProps { allPeople?: BirthdayPerson[]; }
type SearchResult = { found: true; person: BirthdayPerson } | { found: false };

export const PersonalBirthdaySearch: React.FC<PersonalBirthdaySearchProps> = ({ allPeople = TODAY_BIRTHDAYS }) => {
  const [open,   setOpen]   = useState(false);
  const [query,  setQuery]  = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
    else { setQuery(""); setResult(null); }
  }, [open]);

  const handleSearch = () => {
    if (!query.trim()) return;
    const q = query.trim().toLowerCase();
    const match = allPeople.find(p => p.name.toLowerCase().includes(q));
    setResult(match ? { found: true, person: match } : { found: false });
  };

  return (
    <Box sx={{ position: "absolute", bottom: { xs: 28, md: 36 }, right: { xs: 16, md: 32 }, zIndex: 20, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1.2 }}>
      <Collapse in={open} timeout={300}>
        <Box sx={{ ...glassSx(RADIUS.lg), p: 2.2, width: { xs: 290, sm: 320 }, animation: open ? `${fadeSlideDown} 0.3s ease both` : "none" }}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <PersonSearchIcon sx={{ fontSize: 18, color: SOUL.gold }} />
            <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "0.95rem", color: SOUL.text }}>Am I on the list?</Typography>
          </Box>
          <Typography sx={{ fontFamily: FONT, fontSize: "0.72rem", color: SOUL.textMuted, mb: 1.8, lineHeight: 1.5 }}>
            Type your name below to check if you've been added to today's birthday list.
          </Typography>
          <Divider sx={{ borderColor: SOUL.border, mb: 1.8 }} />
          <TextField
            inputRef={inputRef} fullWidth size="small" placeholder="e.g. Kennedy Mutebi" value={query}
            onChange={e => { setQuery(e.target.value); setResult(null); }}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") setOpen(false); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 17, color: SOUL.textMuted }} /></InputAdornment> }}
            sx={{ mb: 1.4, ...fieldSx() }}
          />
          <Button fullWidth variant="contained" onClick={handleSearch} disabled={!query.trim()} startIcon={<PersonSearchIcon sx={{ fontSize: "16px !important" }} />} sx={{ ...goldButtonSx("sm"), mb: result ? 1.4 : 0 }}>
            Check My Birthday
          </Button>
          {result && (
            <Box sx={{
              borderRadius: `${RADIUS.md}px`, p: 1.6, animation: `${fadeSlideDown} 0.3s ease both`,
              bgcolor: result.found ? "rgba(80,200,80,0.12)" : "rgba(220,60,60,0.10)",
              border: `1px solid ${result.found ? "rgba(80,200,80,0.30)" : "rgba(220,60,60,0.25)"}`,
            }}>
              {result.found ? (
                <>
                  <Box display="flex" alignItems="center" gap={0.8} mb={0.8}>
                    <CheckCircleIcon sx={{ fontSize: 18, color: SOUL.success }} />
                    <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "0.85rem", color: SOUL.success }}>You're on the list! 🎉</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: "0.95rem", color: SOUL.text, mb: 0.3 }}>{result.person.name}</Typography>
                  <Typography sx={{ fontFamily: FONT, fontSize: "0.75rem", color: SOUL.textMuted, mb: 0.6 }}>{result.person.location}</Typography>
                  {result.person.birthMonth && result.person.birthDay && (
                    <Chip label={`🎂 ${result.person.birthMonth} ${result.person.birthDay}`} size="small" sx={{ fontFamily: FONT, fontWeight: 700, fontSize: "0.7rem", bgcolor: "rgba(245,166,35,0.13)", color: SOUL.gold, border: "1px solid rgba(245,166,35,0.27)", height: 22 }} />
                  )}
                </>
              ) : (
                <>
                  <Box display="flex" alignItems="center" gap={0.8} mb={0.6}>
                    <CancelIcon sx={{ fontSize: 18, color: SOUL.error }} />
                    <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "0.85rem", color: SOUL.error }}>Not found</Typography>
                  </Box>
                  <Typography sx={{ fontFamily: FONT, fontSize: "0.78rem", color: SOUL.textMuted, lineHeight: 1.55 }}>
                    We couldn't find <strong style={{ color: SOUL.text }}>"{query}"</strong> in our birthday list. Ask your admin to add you, or try a different spelling.
                  </Typography>
                </>
              )}
            </Box>
          )}
        </Box>
      </Collapse>
      <Button
        onClick={() => setOpen(p => !p)}
        startIcon={open ? <CloseIcon sx={{ fontSize: "14px !important" }} /> : <PersonSearchIcon sx={{ fontSize: "15px !important" }} />}
        sx={pillToggleSx(open)}
      >
        {open ? "Close" : "Is my name here?"}
      </Button>
    </Box>
  );
};

// ── BirthdayHeroSlider ─────────────────────────────────────────────────────
interface BirthdayHeroSliderProps {
  people: BirthdayPerson[];
  month: string; day: string;
  onMonthChange: (v: string) => void;
  onDayChange: (v: string) => void;
  onSearch: () => void;
}

export const BirthdayHeroSlider: React.FC<BirthdayHeroSliderProps> = ({ people, month, day, onMonthChange, onDayChange, onSearch }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSlider = useCallback(() => {
    sliderTimer.current = setInterval(() => setActiveSlide(prev => (prev + 1) % Math.max(people.length, 1)), 5000);
  }, [people.length]);

  useEffect(() => {
    startSlider();
    return () => { if (sliderTimer.current) clearInterval(sliderTimer.current); };
  }, [startSlider]);

  const goTo = (idx: number) => {
    if (sliderTimer.current) clearInterval(sliderTimer.current);
    setActiveSlide(idx);
    startSlider();
  };
  const goPrev = () => goTo((activeSlide - 1 + people.length) % people.length);
  const goNext = () => goTo((activeSlide + 1) % people.length);

  return (
    <Box sx={{ position: "relative", width: "100%", height: { xs: "100svh", md: "92vh" }, minHeight: { xs: 520, md: 620 }, maxHeight: { xs: 820, md: 900 }, overflow: "hidden", bgcolor: SOUL.bgDeep }}>
      {people.map((person, idx) => (
        <HeroBirthdayCard key={person.id} person={person} isActive={idx === activeSlide} />
      ))}

      <IconButton onClick={goPrev} sx={{ position: "absolute", left: { xs: 8, md: 24 }, top: "50%", transform: "translateY(-50%)", zIndex: 10, bgcolor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}>
        <ChevronLeftIcon />
      </IconButton>
      <IconButton onClick={goNext} sx={{ position: "absolute", right: { xs: 8, md: 24 }, top: "50%", transform: "translateY(-50%)", zIndex: 10, bgcolor: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}>
        <ChevronRightIcon />
      </IconButton>

      {/* Dot indicators */}
      <Box sx={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 1, zIndex: 10 }}>
        {people.map((_, idx) => (
          <Box
            key={idx}
            onClick={() => goTo(idx)}
            sx={{ width: idx === activeSlide ? 28 : 8, height: 8, borderRadius: "4px", bgcolor: idx === activeSlide ? SOUL.gold : "rgba(255,255,255,0.45)", cursor: "pointer", transition: "all 0.35s ease" }}
          />
        ))}
      </Box>

      {/* Top-left label */}
      <Box sx={{ position: "absolute", top: { xs: 16, md: 28 }, left: { xs: 16, md: 48 }, zIndex: 10 }}>
        <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: { xs: "1.1rem", md: "1.4rem" }, color: "#fff", textShadow: "0 2px 12px rgba(0,0,0,0.6)", lineHeight: 1.2 }}>
          🎂 Today's Birthdays
        </Typography>
        <Typography sx={{ fontFamily: FONT, fontSize: "0.72rem", color: "rgba(255,255,255,0.6)" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </Typography>
      </Box>

      <CelebSearchPanel month={month} day={day} onMonthChange={onMonthChange} onDayChange={onDayChange} onSearch={onSearch} />
      <PersonalBirthdaySearch allPeople={people} />
    </Box>
  );
};

// ── WishCard (single card in the board) ───────────────────────────────────
interface WishCardProps {
  person: BirthdayPerson;
  personWishes: WishEntry[];
  idx: number;
  onWish: (p: BirthdayPerson) => void;
  onViewWishes: (p: BirthdayPerson) => void;
}

const WishCard: React.FC<WishCardProps> = ({ person, personWishes, idx, onWish, onViewWishes }) => (
  <Box
    component="article"
    sx={{
      minWidth: { xs: 260, sm: 280 },
      maxWidth: { xs: 260, sm: 280 },
      scrollSnapAlign: "start",
      flexShrink: 0,
      borderRadius: `${RADIUS.lg}px`,
      overflow: "hidden",
      bgcolor: SOUL.surfaceHigh,
      border: `1px solid ${SOUL.border}`,
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      animation: `${fadeSlideUp} 0.5s ${idx * 0.06}s both`,
      "&:hover": { transform: "translateY(-4px)", boxShadow: "0 16px 48px rgba(0,0,0,0.35)" },
    }}
  >
    {/* Photo */}
    <Box sx={{ height: 180, overflow: "hidden", bgcolor: SOUL.surface, position: "relative" }}>
      <Box
        component="img" src={person.photo} alt={person.name}
        sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", display: "block" }}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
      />
      {person.addedBy && person.addedBy !== "admin" && (
        <Chip
          label={person.addedBy === "friend" ? "Added by friend" : "Self-registered"}
          size="small"
          sx={{ position: "absolute", top: 10, left: 10, fontFamily: FONT, fontSize: "0.60rem", fontWeight: 700, bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.75)", height: 20 }}
        />
      )}
    </Box>

    {/* Body */}
    <Box sx={{ px: 2, pt: 1.8, pb: 1.5 }}>
      <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "1rem", color: SOUL.text, mb: 0.2 }}>{person.name}</Typography>
      <Typography sx={{ fontFamily: FONT, fontSize: "0.75rem", color: SOUL.textMuted, mb: 0.8 }}>
        📍 {person.location}{person.birthMonth && person.birthDay ? ` · 🎂 ${person.birthMonth} ${person.birthDay}` : ""}
      </Typography>
      <Typography sx={{ fontFamily: FONT, fontSize: "0.78rem", color: SOUL.textMuted, lineHeight: 1.6, fontStyle: "italic", mb: 1.8, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        "{person.wishMessage}"
      </Typography>
      <Divider sx={{ borderColor: SOUL.border, mb: 1.8 }} />
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained" size="small"
          onClick={() => onWish(person)}
          startIcon={<CakeIcon sx={{ fontSize: "14px !important" }} />}
          sx={{ flex: 1, ...goldButtonSx("sm") }}
        >
          Wish Them
        </Button>
        <Tooltip title={`${personWishes.length} ${personWishes.length === 1 ? "wish" : "wishes"} received`} placement="top">
          <Button
            variant="outlined" size="small"
            onClick={() => onViewWishes(person)}
            sx={{
              minWidth: 0, width: 38, height: 38, p: 0,
              borderRadius: `${RADIUS.sm}px`,
              border: `1.5px solid ${SOUL.border}`,
              color: SOUL.textMuted,
              "&:hover": { border: `1.5px solid ${SOUL.gold}`, color: SOUL.gold, bgcolor: "rgba(245,166,35,0.08)" },
            }}
          >
            <Badge
              badgeContent={personWishes.length}
              sx={{ "& .MuiBadge-badge": { bgcolor: SOUL.gold, color: SOUL.onGold, fontFamily: FONT, fontWeight: 800, fontSize: "0.60rem", minWidth: 16, height: 16 } }}
            >
              <InboxIcon sx={{ fontSize: 18 }} />
            </Badge>
          </Button>
        </Tooltip>
      </Box>
    </Box>
  </Box>
);

// ── BirthdayWishBoard (horizontal scroll + search) ─────────────────────────
interface BirthdayWishBoardProps {
  people: BirthdayPerson[];
  wishes: WishEntry[];
  onWish: (person: BirthdayPerson) => void;
  onViewWishes: (person: BirthdayPerson) => void;
  onRegister: () => void;
}

export const BirthdayWishBoard: React.FC<BirthdayWishBoardProps> = ({ people, wishes, onWish, onViewWishes, onRegister }) => {
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return people;
    return people.filter(p => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
  }, [people, query]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 300 : -300, behavior: "smooth" });
  };

  return (
    <Box sx={{ py: { xs: 4, md: 7 }, bgcolor: SOUL.bg }}>

      {/* Header */}
      <Box sx={{
        ...containerSx,
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        gap: 2,
        mb: 2.5,
      }}>
        <Box>
          <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: { xs: "1.6rem", md: "2.25rem" }, color: SOUL.text, lineHeight: 1.2 }}>
            🎉 Celebrate with Them
          </Typography>
          <Typography sx={{ fontFamily: FONT, fontSize: "0.88rem", color: SOUL.textMuted, mt: 0.5 }}>
            Send a wish to anyone celebrating today — or add yourself to the list
          </Typography>
        </Box>
        <Button
          variant="outlined" onClick={onRegister} startIcon={<PersonAddIcon />}
          sx={{ ...ghostButtonSx, px: 2.8, py: 1.1, fontSize: "0.88rem", whiteSpace: "nowrap", flexShrink: 0 }}
        >
          Add a Birthday
        </Button>
      </Box>

      {/* Search bar */}
      <Box sx={{ ...containerSx, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by name or location…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: SOUL.textMuted }} />
              </InputAdornment>
            ),
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery("")} sx={{ color: SOUL.textMuted, "&:hover": { color: SOUL.text } }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
          sx={{
            maxWidth: { sm: 420 },
            "& .MuiOutlinedInput-root": {
              fontFamily: FONT, fontSize: "0.9rem", color: SOUL.text,
              bgcolor: SOUL.surfaceHigh, borderRadius: `${RADIUS.md}px`,
              "& fieldset": { borderColor: SOUL.border },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.22)" },
              "&.Mui-focused fieldset": { borderColor: SOUL.gold, borderWidth: "1.5px" },
            },
            "& .MuiInputBase-input::placeholder": { color: SOUL.textFaint, opacity: 1 },
          }}
        />
        {query.trim() && (
          <Typography sx={{ fontFamily: FONT, fontSize: "0.72rem", color: SOUL.textMuted, mt: 1 }}>
            {filtered.length === 0
              ? "No matches found"
              : `${filtered.length} ${filtered.length === 1 ? "person" : "people"} found`}
          </Typography>
        )}
      </Box>

      {/* Scrollable card track */}
      <Box sx={{ position: "relative" }}>

        {/* Left arrow */}
        <IconButton
          onClick={() => scroll("left")}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", zIndex: 5,
            bgcolor: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)",
            color: SOUL.text, border: `1px solid ${SOUL.border}`,
            "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
          }}
        >
          <ChevronLeftIcon />
        </IconButton>

        {/* Right arrow */}
        <IconButton
          onClick={() => scroll("right")}
          sx={{
            display: { xs: "none", md: "flex" },
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", zIndex: 5,
            bgcolor: "rgba(255,255,255,0.08)", backdropFilter: "blur(6px)",
            color: SOUL.text, border: `1px solid ${SOUL.border}`,
            "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
          }}
        >
          <ChevronRightIcon />
        </IconButton>

        {/* Scroll track */}
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            gap: 2.5,
            overflowX: "auto",
            overflowY: "visible",
            px: { xs: 2, md: 7 },
            pb: 2,
            scrollSnapType: "x mandatory",
            "&::-webkit-scrollbar": { height: 5 },
            "&::-webkit-scrollbar-track": { bgcolor: "transparent" },
            "&::-webkit-scrollbar-thumb": { bgcolor: SOUL.border, borderRadius: 3 },
          }}
        >
          {filtered.length === 0 ? (
            <Box sx={{ minWidth: 280, py: 6, px: 3, textAlign: "center", color: SOUL.textFaint, fontFamily: FONT, fontSize: "0.88rem" }}>
              No one matches "{query}"
            </Box>
          ) : (
            filtered.map((person, idx) => (
              <WishCard
                key={person.id}
                person={person}
                personWishes={wishes.filter(w => w.recipientId === person.id)}
                idx={idx}
                onWish={onWish}
                onViewWishes={onViewWishes}
              />
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
};

// ── FamousCelebCard ────────────────────────────────────────────────────────
export const FamousCelebCard: React.FC<(typeof FAMOUS_MATCHES)[0]> = ({ name, born, category, image, fact }) => (
  <Box
    component="article"
    sx={{
      borderRadius: `${RADIUS.lg}px`, overflow: "hidden", bgcolor: SOUL.surfaceHigh,
      border: `1px solid ${SOUL.border}`, cursor: "pointer",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      "&:hover": { transform: "translateY(-4px)", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" },
      "&:hover .celeb-img": { transform: "scale(1.05)" },
    }}
  >
    <Box sx={{ height: { xs: 200, md: 230 }, overflow: "hidden", bgcolor: SOUL.surface, position: "relative" }}>
      <Box
        className="celeb-img" component="img" src={image} alt={name}
        sx={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", transition: "transform 0.4s ease", display: "block" }}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; }}
      />
      <Box sx={{ position: "absolute", top: 10, left: 10, bgcolor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: `${RADIUS.full}px`, px: 1.2, py: 0.3 }}>
        <Typography sx={{ fontFamily: FONT, fontSize: "0.62rem", fontWeight: 700, color: SOUL.gold, letterSpacing: "0.08em" }}>{category.toUpperCase()}</Typography>
      </Box>
    </Box>
    <Box sx={{ px: 2, pt: 1.5, pb: 1.5 }}>
      <Typography sx={{ fontFamily: FONT, fontWeight: 800, fontSize: "1rem", color: SOUL.text, mb: 0.3 }}>{name}</Typography>
      <Typography sx={{ fontFamily: FONT, fontSize: "0.75rem", color: SOUL.gold, fontWeight: 600, mb: 0.8 }}>Born {born}</Typography>
      <Typography sx={{ fontFamily: FONT, fontSize: "0.78rem", color: SOUL.textMuted, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{fact}</Typography>
    </Box>
  </Box>
);

// ── BirthdayPageRoot ───────────────────────────────────────────────────────
export const BirthdayPageRoot: React.FC = () => {
  const [people,       setPeople]       = useState<BirthdayPerson[]>(TODAY_BIRTHDAYS);
  const [wishes,       setWishes]       = useState<WishEntry[]>([]);
  const [wishTarget,   setWishTarget]   = useState<BirthdayPerson | null>(null);
  const [inboxTarget,  setInboxTarget]  = useState<BirthdayPerson | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [celebMonth,   setCelebMonth]   = useState("");
  const [celebDay,     setCelebDay]     = useState("");
  const [snack,        setSnack]        = useState({ open: false, message: "" });

  return (
    <Box sx={{ bgcolor: SOUL.bg }}>
      <BirthdayHeroSlider
        people={people}
        month={celebMonth} day={celebDay}
        onMonthChange={setCelebMonth} onDayChange={setCelebDay}
        onSearch={() => {}}
      />

      <BirthdayWishBoard
        people={people} wishes={wishes}
        onWish={setWishTarget}
        onViewWishes={setInboxTarget}
        onRegister={() => setRegisterOpen(true)}
      />

      <WishModal
        open={!!wishTarget} person={wishTarget}
        onClose={() => setWishTarget(null)}
        onSubmit={wish => {
          setWishes(prev => [wish, ...prev]);
          setSnack({ open: true, message: `🎉 Your wish was sent to ${wishTarget?.name.split(" ")[0]}!` });
        }}
      />

      <WishInboxModal
        open={!!inboxTarget} person={inboxTarget} wishes={wishes}
        onClose={() => setInboxTarget(null)}
      />

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegister={newPerson => {
          setPeople(prev => [...prev, { ...newPerson, id: Date.now() }]);
          setSnack({ open: true, message: `🎂 ${newPerson.name} has been added to the birthday list!` });
        }}
      />

      <Snackbar
        open={snack.open} autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack(s => ({ ...s, open: false }))}
          severity="success"
          sx={{ fontFamily: FONT, fontWeight: 700, borderRadius: `${RADIUS.md}px` }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};