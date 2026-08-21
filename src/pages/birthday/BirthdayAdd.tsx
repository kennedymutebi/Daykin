// src/pages/birthday/BirthdayAdd.tsx
//
// CHANGES in this version:
//  - The roster now only shows celebrants the logged-in user personally
//    created, using ?mine=true against the backend (which is already
//    scoped server-side via CelebrantViewSet.get_queryset). Previously
//    this called listCelebrants() with no args, which returned EVERYONE's
//    celebrants — that's correct for the public feed (BirthdayFeed.tsx)
//    but wrong here, since this page is specifically "manage what I added".
//  - The roster list still hides anyone whose birthday has already passed
//    this year (past the same 1-hour grace period used on the feed), so
//    once a celebration is done it drops out of view instead of sitting
//    in the list looking "still pending". It reappears automatically as
//    that date comes back around next year.
//  - Everything else — the form, photo upload, edit/delete flow, photo
//    polish wait — is unchanged.

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Box, Typography, TextField, Button, LinearProgress, InputAdornment, useTheme, IconButton,
  Snackbar, Alert, Avatar, List, ListItem, ListItemAvatar, ListItemText, Divider, CircularProgress,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import AddAPhotoOutlinedIcon from "@mui/icons-material/AddAPhotoOutlined";
import CloseIcon from "@mui/icons-material/Close";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import {
  createCelebrant,
  parseMonthDay,
  listCelebrants,
  updateCelebrant,
  deleteCelebrant,
  type CelebrantDTO as Celebrant, // matches your real api/birthdays.ts export
} from "../../api/birthdays"; // adjust path if needed
import { AUTH_TOKEN_KEY } from "../../config/api.config"; // adjust path if needed

const fieldSx = (isDark: boolean) => ({
  "& .MuiOutlinedInput-root": {
    bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F7",
    borderRadius: 2,
  },
});

// httpClient throws a plain Error shaped like "API error 401: ..." — this
// pulls the status code back out so we can branch on it.
function getErrorStatus(err: unknown): number | null {
  if (err instanceof Error) {
    const match = err.message.match(/^API error (\d+):/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

function formatMonthDay(month?: number, day?: number): string {
  if (!month || !day) return "—";
  const d = new Date(2000, month - 1, day);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// A birthday counts as "still upcoming/active" if it's today, in the
// future this year, OR was yesterday and we're still within the first
// GRACE_PERIOD_HOURS of the new day. Once that window closes, it's
// treated as "passed" and dropped from the roster view until it comes
// back around next year.
const GRACE_PERIOD_HOURS = 1;

function hasBirthdayPassed(month?: number, day?: number, now: Date = new Date()): boolean {
  if (!month || !day) return false; // no date on record — don't hide it

  const todayMonth = now.getMonth() + 1;
  const todayDay = now.getDate();

  // Today — never "passed"
  if (month === todayMonth && day === todayDay) return false;

  // Yesterday, but still inside the grace window — treat as not passed yet
  if (now.getHours() < GRACE_PERIOD_HOURS) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (month === yesterday.getMonth() + 1 && day === yesterday.getDate()) return false;
  }

  // Compare month/day against today using a fixed reference year so we
  // can order across the calendar without caring what year it actually is.
  const refYear = 2000;
  const target = new Date(refYear, month - 1, day);
  const today = new Date(refYear, todayMonth - 1, todayDay);
  return target.getTime() < today.getTime();
}

const emptyForm = { name: "", birthDate: "", location: "", wish: "" };

const BirthdayAdd: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold = theme.palette.gold.main;
  const textMuted = theme.palette.text.secondary;

  const [form, setForm] = useState({ ...emptyForm });

  // ---- edit mode --------------------------------------------------------
  const [editingId, setEditingId] = useState<number | null>(null);

  // ---- profile photo --------------------------------------------------
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---- submission state -------------------------------------------------
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Shown after a successful create/update while we deliberately hold off
  // refreshing the roster — gives the backend time to finish the photo
  // cutout so the card and its photo appear together instead of the
  // photo popping in a few seconds after the row does.
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const PHOTO_WAIT_MS = 5000;

  // ---- roster list state --------------------------------------------------
  const [roster, setRoster] = useState<Celebrant[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Celebrant | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchRoster = useCallback(async () => {
    setRosterLoading(true);
    setRosterError(null);
    try {
      // ?mine=true — this page is "manage what I added", so it must only
      // ever show the logged-in user's own celebrants, never everyone's.
      // The backend (CelebrantViewSet.get_queryset) already enforces this
      // scoping server-side; passing mine:true here just asks for it.
      const data = await listCelebrants({ mine: true });
      setRoster(data);
    } catch (err) {
      setRosterError(err instanceof Error ? err.message : "Couldn't load the roster.");
    } finally {
      setRosterLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  // Roster filtered to hide anyone whose birthday has already passed this
  // year (past the grace window). Recomputed only when the roster changes —
  // not on every render — so this stays cheap even with a big list.
  const visibleRoster = useMemo(
    () => roster.filter((c) => !hasBirthdayPassed(c.birth_month, c.birth_day)),
    [roster]
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filledCount = Object.values(form).filter((v) => v.trim().length > 0).length + (imagePreview ? 1 : 0);
  const completeness = Math.round((filledCount / 5) * 100);

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const resetForm = () => {
    setForm({ ...emptyForm });
    setImagePreview(null);
    setPhotoFile(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Click the edit icon on a roster row: load that celebrant into the form.
  const handleEditClick = (celebrant: Celebrant) => {
    setEditingId(celebrant.id);
    setForm({
      name: celebrant.full_name ?? "",
      birthDate:
        celebrant.birth_month && celebrant.birth_day
          ? `${String(celebrant.birth_month).padStart(2, "0")}/${String(celebrant.birth_day).padStart(2, "0")}/2000`
          : "",
      location: celebrant.location ?? "",
      wish: celebrant.big_wish ?? "",
    });
    setImagePreview(celebrant.photo ?? null);
    setPhotoFile(null); // only set if the user picks a new file
    setError(null);
    setSuccessMessage(null);
    // Scroll the form into view since the roster sits below it.
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteClick = (celebrant: Celebrant) => setDeleteTarget(celebrant);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteCelebrant(deleteTarget.id);
      setRoster((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setSuccessMessage(`${deleteTarget.full_name} was removed.`);
      if (editingId === deleteTarget.id) resetForm();
    } catch (err) {
      const status = getErrorStatus(err);
      setError(
        status === 401 || status === 403
          ? "Please login to manage the roster."
          : err instanceof Error ? err.message : "Couldn't delete that entry."
      );
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    // Popup instead of redirect — page stays put either way
    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      setError("Please login to add a celebrant.");
      return;
    }

    if (!form.name.trim()) {
      setError("Full name is required.");
      return;
    }

    const parsed = parseMonthDay(form.birthDate);
    if (!parsed) {
      setError("Enter a valid date as mm/dd/yyyy.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: form.name.trim(),
        birth_month: parsed.month,
        birth_day: parsed.day,
        location: form.location.trim() || undefined,
        big_wish: form.wish.trim() || undefined,
        photo: photoFile, // only present when the user picked a new file
      };

      const name = form.name.trim();
      const hadPhoto = !!photoFile;
      const wasEditing = !!editingId;

      if (editingId) {
        await updateCelebrant(editingId, payload);
      } else {
        await createCelebrant(payload);
      }

      resetForm();

      if (hadPhoto) {
        // Give the backend a moment to finish the background-removal step
        // before we pull the roster again, so the card shows up complete.
        setSubmitting(true); // keep the button in its loading state during the wait
        setPreparingPhoto(true);
        setSuccessMessage(`${name} was saved — polishing the photo…`);
        setTimeout(async () => {
          await fetchRoster();
          setPreparingPhoto(false);
          setSubmitting(false);
          setSuccessMessage(`${name} is ready on the roster!`);
        }, PHOTO_WAIT_MS);
      } else {
        setSuccessMessage(wasEditing ? `${name} was updated!` : `${name} was added to the roster!`);
        fetchRoster();
      }
    } catch (err) {
      const status = getErrorStatus(err);
      if (status === 401 || status === 403) {
        setError("Please login to add a celebrant.");
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const labelSx = { fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.5px", color: textMuted, mb: 0.5 };

  return (
    <Box display="flex" flexDirection="column" gap={2.5} sx={{ maxWidth: { md: 900 }, mx: { md: "auto" } }}>
      <Box>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: "1.4rem", md: "1.7rem" }, color: theme.palette.text.primary }}>
          {editingId ? "Edit Celebration" : "New Celebration"}
        </Typography>
        <Typography sx={{ fontSize: "0.85rem", color: textMuted }}>
          {editingId
            ? "Update this VIP's details below."
            : "Add a new VIP to your professional birthday roster."}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.5, alignItems: "flex-start" }}>
        {/* Form card */}
        <Box
          sx={{
            bgcolor: theme.palette.background.paper,
            borderRadius: 4,
            p: 2.5,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            flex: { md: "1 1 60%" },
            width: "100%",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          {/* Photo */}
          <Box>
            <Typography sx={labelSx}>PHOTO</Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />

            {imagePreview ? (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  overflow: "hidden",
                  height: 150,
                  cursor: "pointer",
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F7",
                }}
              >
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Selected"
                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <IconButton
                  onClick={handleRemoveImage}
                  size="small"
                  aria-label="Remove photo"
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.55)",
                    color: "#fff",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    py: 0.6,
                    textAlign: "center",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: "#fff",
                    bgcolor: "rgba(0,0,0,0.45)",
                  }}
                >
                  Tap to change photo
                </Box>
              </Box>
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  borderRadius: 2,
                  height: 110,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 0.6,
                  cursor: "pointer",
                  bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F5F5F7",
                  border: `1.5px dashed ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"}`,
                  "&:hover": { borderColor: gold },
                }}
              >
                <AddAPhotoOutlinedIcon sx={{ color: gold, fontSize: 22 }} />
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: textMuted }}>
                  Tap to add a photo
                </Typography>
              </Box>
            )}
          </Box>

          <Box>
            <Typography sx={labelSx}>FULL NAME</Typography>
            <TextField
              fullWidth size="small" placeholder="e.g. Johnathan Smith"
              value={form.name} onChange={handleChange("name")}
              sx={fieldSx(isDark)}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlineIcon fontSize="small" /></InputAdornment> }}
            />
          </Box>
          <Box>
            <Typography sx={labelSx}>BIRTH DATE</Typography>
            <TextField
              fullWidth size="small" placeholder="mm/dd/yyyy"
              value={form.birthDate} onChange={handleChange("birthDate")}
              sx={fieldSx(isDark)}
              InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" /></InputAdornment> }}
              helperText="Only the month and day are saved — no year needed."
            />
          </Box>
          <Box>
            <Typography sx={labelSx}>LOCATION</Typography>
            <TextField
              fullWidth size="small" placeholder="City or Venue"
              value={form.location} onChange={handleChange("location")}
              sx={fieldSx(isDark)}
              InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnOutlinedIcon fontSize="small" /></InputAdornment> }}
            />
          </Box>
          <Box>
            <Typography sx={labelSx}>THE BIG WISH</Typography>
            <TextField
              fullWidth size="small" multiline minRows={3}
              placeholder="What's their dream celebration?"
              value={form.wish} onChange={handleChange("wish")}
              sx={fieldSx(isDark)}
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><AutoAwesomeIcon fontSize="small" /></InputAdornment> }}
            />
          </Box>

          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography sx={labelSx}>PROFILE COMPLETENESS</Typography>
              <Typography sx={{ fontWeight: 700, fontSize: "0.8rem", color: gold }}>{completeness}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate" value={completeness}
              sx={{
                height: 6, borderRadius: 3,
                bgcolor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
                "& .MuiLinearProgress-bar": { bgcolor: gold, borderRadius: 3 },
              }}
            />
          </Box>

          {preparingPhoto && (
            <Box
              sx={{
                display: "flex", alignItems: "center", gap: 1,
                bgcolor: isDark ? "rgba(245,166,35,0.1)" : "#FBF3E2",
                border: `1px solid ${gold}55`, borderRadius: 2, px: 1.5, py: 1,
              }}
            >
              <CircularProgress size={16} sx={{ color: gold }} />
              <Typography sx={{ fontSize: "0.8rem", color: textMuted }}>
                Polishing the photo — this takes a few seconds…
              </Typography>
            </Box>
          )}

          <Box display="flex" gap={1.5}>
            <Button
              fullWidth
              disabled={submitting}
              onClick={handleSubmit}
              startIcon={editingId ? <EditOutlinedIcon /> : <AddCircleOutlineIcon />}
              sx={{
                background: "linear-gradient(90deg, #B8860B, #F5A623)",
                color: "#0D0D0D", fontWeight: 700, borderRadius: 2, py: 1.2,
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (editingId ? "Updating…" : "Adding…") : editingId ? "Save Changes" : "Add to Roster"}
            </Button>
            {editingId && (
              <Button
                onClick={resetForm}
                disabled={submitting}
                sx={{ fontWeight: 700, borderRadius: 2, py: 1.2, color: textMuted }}
              >
                Cancel
              </Button>
            )}
          </Box>
        </Box>

        {/* Pro tip */}
        <Box
          sx={{
            bgcolor: isDark ? "rgba(245,166,35,0.08)" : "#FBF3E2",
            borderRadius: 3,
            p: 2.2,
            display: "flex",
            gap: 1.2,
            flex: { md: "1 1 40%" },
            width: "100%",
            border: `1px solid ${gold}33`,
          }}
        >
          <LightbulbOutlinedIcon sx={{ color: gold }} />
          <Box>
            <Typography sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.3 }}>Pro Tip</Typography>
            <Typography sx={{ fontSize: "0.82rem", color: textMuted }}>
              Adding a photo and location helps us suggest the best local vendors and celebration spots for this person's special day!
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Roster list — view / edit / delete */}
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          borderRadius: 4,
          p: 2.5,
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "1.1rem", color: theme.palette.text.primary, mb: 1.5 }}>
          Your Roster
        </Typography>

        {rosterLoading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={22} sx={{ color: gold }} />
          </Box>
        ) : rosterError ? (
          <Typography sx={{ fontSize: "0.85rem", color: theme.palette.error.main }}>{rosterError}</Typography>
        ) : visibleRoster.length === 0 ? (
          <Typography sx={{ fontSize: "0.85rem", color: textMuted }}>
            {roster.length === 0
              ? "You haven't added anyone yet — add your first VIP above."
              : "No upcoming celebrations — anyone whose birthday has passed is hidden until it comes around again."}
          </Typography>
        ) : (
          <List disablePadding>
            {visibleRoster.map((celebrant, i) => (
              <React.Fragment key={celebrant.id}>
                <ListItem
                  disableGutters
                  secondaryAction={
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditClick(celebrant)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick(celebrant)}
                          disabled={deletingId === celebrant.id}
                        >
                          {deletingId === celebrant.id
                            ? <CircularProgress size={16} />
                            : <DeleteOutlineIcon fontSize="small" sx={{ color: theme.palette.error.main }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    {/* Fallback avatar for rows with no photo_url — keeps the row from
                        looking broken instead of a missing/alt-text image icon. */}
                    <Avatar src={celebrant.photo || undefined} sx={{ bgcolor: `${gold}33`, color: gold }}>
                      {!celebrant.photo && <PersonOutlineIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={celebrant.full_name}
                    secondary={
                      <Box component="span" display="flex" alignItems="center" gap={0.6} sx={{ color: textMuted, fontSize: "0.78rem" }}>
                        <CakeOutlinedIcon sx={{ fontSize: 14 }} />
                        {formatMonthDay(celebrant.birth_month, celebrant.birth_day)}
                        {celebrant.location ? ` · ${celebrant.location}` : ""}
                      </Box>
                    }
                  />
                </ListItem>
                {i < visibleRoster.length - 1 && <Divider component="li" sx={{ opacity: 0.5 }} />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Remove {deleteTarget?.full_name}?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.9rem", color: textMuted }}>
            This will permanently remove them from the roster.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Popup feedback */}
      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={error ? "error" : "success"}
          onClose={handleCloseSnackbar}
          sx={{ width: "100%" }}
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BirthdayAdd;