// src/components/shared/AuthModal.tsx
import React, { useState } from "react";
import {
  Dialog, DialogContent, Box, Typography, TextField,
  Button, IconButton, InputAdornment, Divider, Checkbox,
  FormControlLabel, Link, Stack, Avatar, Fade, Collapse,
  Alert, CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon          from "@mui/icons-material/Close";
import VisibilityIcon     from "@mui/icons-material/Visibility";
import VisibilityOffIcon  from "@mui/icons-material/VisibilityOff";
import GoogleIcon         from "@mui/icons-material/Google";
import GitHubIcon         from "@mui/icons-material/GitHub";
import ArrowBackIcon      from "@mui/icons-material/ArrowBack";
import EmailOutlinedIcon  from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon   from "@mui/icons-material/LockOutlined";
import PersonOutlineIcon  from "@mui/icons-material/PersonOutline";

import logo from "../../assets/writerlog.jpg";

// ── Types ─────────────────────────────────────────────────────────────────────
type AuthView = "signin" | "signup" | "forgot";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  /** Which view to start on. Defaults to "signin". */
  defaultView?: AuthView;
  /** Called after a successful submission (wire up your auth logic here). */
  onSuccess?: (view: AuthView, data: Record<string, string>) => void;
}

// ── Shared field config ───────────────────────────────────────────────────────
interface FieldState {
  value: string;
  error: string;
}

const emptyField = (): FieldState => ({ value: "", error: "" });

function validate(
  view: AuthView,
  fields: Record<string, FieldState>
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (view === "signup" && !fields.name?.value.trim()) {
    errors.name = "Display name is required";
  }

  const email = fields.email?.value.trim();
  if (!email) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email address";

  if (view !== "forgot") {
    const pw = fields.password?.value ?? "";
    if (!pw) errors.password = "Password is required";
    else if (pw.length < 8) errors.password = "At least 8 characters";
  }

  if (view === "signup") {
    const confirm = fields.confirm?.value ?? "";
    if (!confirm) errors.confirm = "Please confirm your password";
    else if (confirm !== fields.password?.value)
      errors.confirm = "Passwords don't match";
  }

  return errors;
}

// ── Reusable styled text field ─────────────────────────────────────────────
const AuthField: React.FC<{
  label: string;
  id: string;
  type?: string;
  value: string;
  error: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  endAdornment?: React.ReactNode;
  autoComplete?: string;
}> = ({ label, id, type = "text", value, error, onChange, icon, endAdornment, autoComplete }) => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === "dark";
  const gold    = theme.palette.gold.main;

  return (
    <TextField
      id={id} label={label} type={type} fullWidth size="small"
      value={value} onChange={(e) => onChange(e.target.value)}
      error={!!error} helperText={error}
      autoComplete={autoComplete}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box sx={{ color: error ? "error.main" : theme.palette.text.disabled, display: "flex" }}>
              {icon}
            </Box>
          </InputAdornment>
        ),
        endAdornment: endAdornment ? (
          <InputAdornment position="end">{endAdornment}</InputAdornment>
        ) : undefined,
      }}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
          fontSize: "0.9rem",
          fontFamily: theme.typography.fontFamily,
          bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
          transition: "background 0.2s",
          "&:hover": {
            bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)",
          },
          "&.Mui-focused": {
            bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: gold,
            borderWidth: "1.5px",
          },
        },
        "& .MuiInputLabel-root.Mui-focused": { color: gold },
        "& .MuiFormHelperText-root": {
          fontFamily: theme.typography.fontFamily,
          fontSize: "0.72rem",
        },
      }}
    />
  );
};

// ── OAuth button ───────────────────────────────────────────────────────────
const OAuthButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Button
      fullWidth variant="outlined" startIcon={icon}
      onClick={onClick}
      sx={{
        fontFamily: theme.typography.fontFamily,
        fontWeight: 600, fontSize: "0.85rem",
        textTransform: "none", borderRadius: 2,
        py: 1,
        borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
        color: theme.palette.text.secondary,
        "&:hover": {
          borderColor: theme.palette.text.primary,
          color: theme.palette.text.primary,
          bgcolor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
        },
      }}
    >
      {label}
    </Button>
  );
};

// ── Tab pill ───────────────────────────────────────────────────────────────
const TabPill: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => {
  const theme = useTheme();
  const gold  = theme.palette.gold.main;

  return (
    <Button
      onClick={onClick} disableRipple
      sx={{
        fontFamily: theme.typography.fontFamily,
        fontWeight: active ? 700 : 500,
        fontSize: "0.9rem",
        textTransform: "none",
        color: active ? gold : theme.palette.text.disabled,
        px: 0, pb: 1.2, borderRadius: 0,
        borderBottom: "2px solid",
        borderColor: active ? gold : "transparent",
        transition: "all 0.2s",
        "&:hover": { color: active ? gold : theme.palette.text.secondary, bgcolor: "transparent" },
      }}
    >
      {label}
    </Button>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  defaultView = "signin",
  onSuccess,
}) => {
  const theme  = useTheme();
  const isDark = theme.palette.mode === "dark";
  const gold   = theme.palette.gold.main;

  // ── View state
  const [view, setView] = useState<AuthView>(defaultView);

  // ── Form field states
  const [name,     setName]     = useState<FieldState>(emptyField());
  const [email,    setEmail]    = useState<FieldState>(emptyField());
  const [password, setPassword] = useState<FieldState>(emptyField());
  const [confirm,  setConfirm]  = useState<FieldState>(emptyField());
  const [showPw,   setShowPw]   = useState(false);
  const [showCpw,  setShowCpw]  = useState(false);
  const [remember, setRemember] = useState(false);
  const [agreed,   setAgreed]   = useState(false);
  const [agreedErr, setAgreedErr] = useState(false);

  // ── Async state
  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clearFeedback = () => setFeedback(null);

  const switchView = (v: AuthView) => {
    setView(v);
    clearFeedback();
    // reset errors but keep typed values for convenience
    setName    (s => ({ ...s, error: "" }));
    setEmail   (s => ({ ...s, error: "" }));
    setPassword(s => ({ ...s, error: "" }));
    setConfirm (s => ({ ...s, error: "" }));
    setAgreedErr(false);
  };

  const handleClose = () => {
    onClose();
    // small delay before resetting so the close animation plays cleanly
    setTimeout(() => {
      setView(defaultView);
      setName(emptyField()); setEmail(emptyField());
      setPassword(emptyField()); setConfirm(emptyField());
      setFeedback(null); setLoading(false);
    }, 300);
  };

  const applyErrors = (errs: Record<string, string>) => {
    if (errs.name)     setName    (s => ({ ...s, error: errs.name }));
    if (errs.email)    setEmail   (s => ({ ...s, error: errs.email }));
    if (errs.password) setPassword(s => ({ ...s, error: errs.password }));
    if (errs.confirm)  setConfirm (s => ({ ...s, error: errs.confirm }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    clearFeedback();
    const fields = { name, email, password, confirm };
    const errs   = validate(view, fields);

    if (view === "signup" && !agreed) {
      setAgreedErr(true);
      return;
    }

    if (Object.keys(errs).length > 0) { applyErrors(errs); return; }

    setLoading(true);
    // Simulate async — replace with your real auth call
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);

    if (view === "forgot") {
      setFeedback({ type: "success", msg: `Reset link sent to ${email.value}` });
    } else {
      const data: Record<string, string> = { email: email.value };
      if (view === "signup") data.name = name.value;
      onSuccess?.(view, data);
      handleClose();
    }
  };

  // ── Eye toggle adornment factory ──────────────────────────────────────────
  const eyeToggle = (show: boolean, toggle: () => void) => (
    <IconButton size="small" onClick={toggle} edge="end"
      sx={{ color: theme.palette.text.disabled }}>
      {show ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
    </IconButton>
  );

  // ── Layout tokens ─────────────────────────────────────────────────────────
  const dividerColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const SORA = theme.typography.fontFamily;

  return (
    <Dialog
      open={open} onClose={handleClose}
      maxWidth="xs" fullWidth
      TransitionComponent={Fade}
      transitionDuration={280}
      PaperProps={{
        sx: {
          borderRadius: 3,
          bgcolor: theme.palette.background.paper,
          backgroundImage: "none",
          border: `1px solid ${dividerColor}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>

        {/* ── Top accent bar ── */}
        <Box sx={{ height: 3, background: `linear-gradient(90deg, ${gold}, ${gold}80)` }} />

        <Box sx={{ px: { xs: 3, sm: 4 }, pt: 3.5, pb: 4 }}>

          {/* ── Header row ── */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
            <Box display="flex" alignItems="center" gap={1.2}>
              {view === "forgot" && (
                <IconButton size="small" onClick={() => switchView("signin")}
                  sx={{ color: theme.palette.text.secondary, mr: 0.5 }}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
              )}
              <Box
                component="img" src={logo} alt="Daykin"
                sx={{ width: 30, height: 30, borderRadius: 1.5, objectFit: "cover" }}
              />
              <Typography sx={{ fontFamily: SORA, fontWeight: 900, fontSize: "1.05rem", lineHeight: 1 }}>
                <Box component="span" sx={{ color: gold }}>Day</Box>
                <Box component="span" sx={{ color: theme.palette.text.primary }}>kin</Box>
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleClose}
              sx={{ color: theme.palette.text.disabled, "&:hover": { color: theme.palette.text.primary } }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* ── Tab switcher (signin / signup only) ── */}
          {view !== "forgot" && (
            <Stack direction="row" spacing={3} mb={3}
              sx={{ borderBottom: `1px solid ${dividerColor}` }}>
              <TabPill label="Sign in"     active={view === "signin"} onClick={() => switchView("signin")} />
              <TabPill label="Create account" active={view === "signup"} onClick={() => switchView("signup")} />
            </Stack>
          )}

          {/* ── Forgot password heading ── */}
          {view === "forgot" && (
            <Box mb={2.5}>
              <Typography sx={{ fontFamily: SORA, fontWeight: 700, fontSize: "1.25rem",
                color: theme.palette.text.primary, mb: 0.5 }}>
                Forgot password?
              </Typography>
              <Typography sx={{ fontFamily: SORA, fontSize: "0.85rem",
                color: theme.palette.text.secondary }}>
                We'll send a reset link to your email.
              </Typography>
            </Box>
          )}

          {/* ── Feedback alert ── */}
          <Collapse in={!!feedback}>
            <Alert
              severity={feedback?.type ?? "info"}
              onClose={clearFeedback}
              sx={{ mb: 2, borderRadius: 2, fontFamily: SORA, fontSize: "0.82rem" }}
            >
              {feedback?.msg}
            </Alert>
          </Collapse>

          {/* ── OAuth (signin / signup only) ── */}
          {view !== "forgot" && (
            <>
              <Stack spacing={1.2} mb={2.5}>
                <OAuthButton icon={<GoogleIcon fontSize="small" />} label="Continue with Google" />
                <OAuthButton icon={<GitHubIcon fontSize="small" />} label="Continue with GitHub" />
              </Stack>

              <Divider sx={{ borderColor: dividerColor, mb: 2.5 }}>
                <Typography sx={{ fontFamily: SORA, fontSize: "0.72rem",
                  color: theme.palette.text.disabled, px: 1 }}>
                  or with email
                </Typography>
              </Divider>
            </>
          )}

          {/* ── Fields ── */}
          <Stack spacing={2}>

            {/* Name — signup only */}
            {view === "signup" && (
              <AuthField
                id="auth-name" label="Display name" value={name.value} error={name.error}
                onChange={(v) => setName({ value: v, error: "" })}
                icon={<PersonOutlineIcon fontSize="small" />}
                autoComplete="name"
              />
            )}

            {/* Email */}
            <AuthField
              id="auth-email" label="Email address" type="email"
              value={email.value} error={email.error}
              onChange={(v) => setEmail({ value: v, error: "" })}
              icon={<EmailOutlinedIcon fontSize="small" />}
              autoComplete="email"
            />

            {/* Password */}
            {view !== "forgot" && (
              <AuthField
                id="auth-password" label="Password"
                type={showPw ? "text" : "password"}
                value={password.value} error={password.error}
                onChange={(v) => setPassword({ value: v, error: "" })}
                icon={<LockOutlinedIcon fontSize="small" />}
                endAdornment={eyeToggle(showPw, () => setShowPw(p => !p))}
                autoComplete={view === "signup" ? "new-password" : "current-password"}
              />
            )}

            {/* Confirm password — signup only */}
            {view === "signup" && (
              <AuthField
                id="auth-confirm" label="Confirm password"
                type={showCpw ? "text" : "password"}
                value={confirm.value} error={confirm.error}
                onChange={(v) => setConfirm({ value: v, error: "" })}
                icon={<LockOutlinedIcon fontSize="small" />}
                endAdornment={eyeToggle(showCpw, () => setShowCpw(p => !p))}
                autoComplete="new-password"
              />
            )}
          </Stack>

          {/* ── Remember me / Forgot ── */}
          {view === "signin" && (
            <Box display="flex" alignItems="center" justifyContent="space-between" mt={1.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    sx={{
                      color: theme.palette.text.disabled,
                      "&.Mui-checked": { color: gold },
                      "& .MuiSvgIcon-root": { fontSize: 16 },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontFamily: SORA, fontSize: "0.8rem",
                    color: theme.palette.text.secondary }}>
                    Remember me
                  </Typography>
                }
                sx={{ m: 0 }}
              />
              <Link
                component="button" onClick={() => switchView("forgot")}
                underline="none"
                sx={{
                  fontFamily: SORA, fontSize: "0.8rem", fontWeight: 600,
                  color: gold,
                  "&:hover": { opacity: 0.8 },
                }}
              >
                Forgot password?
              </Link>
            </Box>
          )}

          {/* ── Terms checkbox — signup only ── */}
          {view === "signup" && (
            <Box mt={1.5}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small" checked={agreed}
                    onChange={(e) => { setAgreed(e.target.checked); setAgreedErr(false); }}
                    sx={{
                      color: agreedErr ? "error.main" : theme.palette.text.disabled,
                      "&.Mui-checked": { color: gold },
                      "& .MuiSvgIcon-root": { fontSize: 16 },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontFamily: SORA, fontSize: "0.8rem",
                    color: agreedErr ? "error.main" : theme.palette.text.secondary }}>
                    I agree to the{" "}
                    <Link href="#" underline="none" sx={{ color: gold, fontWeight: 600 }}>
                      Terms of Service
                    </Link>{" "}
                    &{" "}
                    <Link href="#" underline="none" sx={{ color: gold, fontWeight: 600 }}>
                      Privacy Policy
                    </Link>
                  </Typography>
                }
                sx={{ m: 0, alignItems: "flex-start" }}
              />
              {agreedErr && (
                <Typography sx={{ fontFamily: SORA, fontSize: "0.72rem",
                  color: "error.main", mt: 0.5, pl: 3.5 }}>
                  You must agree to continue
                </Typography>
              )}
            </Box>
          )}

          {/* ── Submit button ── */}
          <Button
            fullWidth variant="contained"
            onClick={handleSubmit} disabled={loading}
            sx={{
              mt: 2.5, py: 1.15, borderRadius: 2,
              fontFamily: SORA, fontWeight: 700, fontSize: "0.92rem",
              textTransform: "none",
              bgcolor: gold, color: "#0D0D0D",
              "&:hover": { bgcolor: "#D4891A" },
              "&:disabled": { bgcolor: isDark ? "rgba(245,166,35,0.35)" : "rgba(245,166,35,0.4)", color: "#0D0D0D" },
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: "#0D0D0D" }} />
            ) : (
              <>
                {view === "signin"  && "Sign in to Daykin"}
                {view === "signup"  && "Create my account"}
                {view === "forgot"  && "Send reset link"}
              </>
            )}
          </Button>

          {/* ── Bottom switcher text ── */}
          {view !== "forgot" && (
            <Typography sx={{ fontFamily: SORA, fontSize: "0.82rem", textAlign: "center",
              color: theme.palette.text.secondary, mt: 2 }}>
              {view === "signin" ? "Don't have an account? " : "Already have an account? "}
              <Link
                component="button"
                onClick={() => switchView(view === "signin" ? "signup" : "signin")}
                underline="none"
                sx={{ fontWeight: 700, color: gold, "&:hover": { opacity: 0.8 } }}
              >
                {view === "signin" ? "Join free" : "Sign in"}
              </Link>
            </Typography>
          )}

        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;