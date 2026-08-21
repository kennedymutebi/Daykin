// src/components/shared/SubscriptionsList.tsx
import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography, Avatar, Stack, Button, Skeleton, Snackbar, Alert } from "@mui/material";
import { useSubscriptions } from "../../context/SubscriptionsContext";
import { ApiError } from "../../services/api.service";

const SERIF = "'Playfair Display', Georgia, serif";

export const SubscriptionsList: React.FC = () => {
  const theme = useTheme();
  const gold  = theme.palette.gold?.main ?? "#F5A623";
  const { subscriptions, loading, toggleSubscribe } = useSubscriptions();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUnsubscribe = async (authorId: number) => {
    setBusyId(authorId);
    setErrorMsg(null);
    try {
      await toggleSubscribe(authorId);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof ApiError ? err.firstError : "Could not unsubscribe. Please try again.",
      );
    } finally {
      setBusyId(null);
    }
  };

  if (loading && subscriptions.length === 0) {
    return (
      <Stack spacing={1.5}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Stack key={i} direction="row" alignItems="center" spacing={1.5}>
            <Skeleton variant="circular" width={38} height={38} />
            <Skeleton width="40%" height={16} />
          </Stack>
        ))}
      </Stack>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Typography sx={{ fontFamily: SERIF, fontSize: "0.85rem", color: theme.palette.text.disabled }}>
        You aren't subscribed to any writers yet.
      </Typography>
    );
  }

  return (
    <>
    <Stack spacing={1.5}>
      {subscriptions.map((sub) => (
        <Stack key={sub.id} direction="row" alignItems="center" spacing={1.5}>
          <Avatar sx={{
            width: 38, height: 38, bgcolor: gold,
            fontFamily: SERIF, fontSize: "0.7rem", fontWeight: 700,
          }}>
            {sub.author.initials}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography sx={{
              fontFamily: SERIF, fontSize: "0.88rem", fontWeight: 600,
              color: theme.palette.text.primary,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>
              {sub.author.name}
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => handleUnsubscribe(sub.author.id)}
            disabled={busyId === sub.author.id}
            sx={{
              fontFamily: SERIF, fontWeight: 700, fontSize: "0.72rem",
              textTransform: "none",
              color: theme.palette.text.secondary,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: "6px", px: 1.5,
              "&:hover": { borderColor: gold, color: gold },
            }}
          >
            Unsubscribe
          </Button>
        </Stack>
      ))}
    </Stack>

    <Snackbar
      open={!!errorMsg}
      autoHideDuration={4000}
      onClose={() => setErrorMsg(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity="error" onClose={() => setErrorMsg(null)} sx={{ fontFamily: SERIF, borderRadius: "10px" }}>
        {errorMsg}
      </Alert>
    </Snackbar>
    </>
  );
};