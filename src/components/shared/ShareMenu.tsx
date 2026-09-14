// src/components/shared/ShareMenu.tsx
// The actual share menu — WhatsApp / X / Facebook / Telegram / Copy Link.
// The counter only bumps once the person picks one of these (see onShared),
// not the instant the Share button is tapped, so the number reflects real
// shares instead of just clicks.

import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, List, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  /** Called once, only when the link is actually used (platform opened or copied). */
  onShared: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ open, onClose, shareUrl, title, onShared }) => {
  const [copied, setCopied] = useState(false);

  const openPlatform = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onShared();
    onClose();
  };

  const encodedUrl   = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const options = [
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon />,
      action: () => openPlatform(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`),
    },
    {
      label: "X (Twitter)",
      icon: <TwitterIcon />,
      action: () => openPlatform(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`),
    },
    {
      label: "Facebook",
      icon: <FacebookIcon />,
      action: () => openPlatform(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`),
    },
    {
      label: "Telegram",
      icon: <TelegramIcon />,
      action: () => openPlatform(`https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`),
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      onShared();
    } catch {
      // Clipboard access blocked — nothing to recover, user can still
      // select the link text manually if the browser shows it.
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Share this article
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <List>
            {options.map((opt) => (
              <ListItemButton key={opt.label} onClick={opt.action}>
                <ListItemIcon>{opt.icon}</ListItemIcon>
                <ListItemText primary={opt.label} />
              </ListItemButton>
            ))}
            <ListItemButton onClick={handleCopy}>
              <ListItemIcon><ContentCopyIcon /></ListItemIcon>
              <ListItemText primary="Copy link" />
            </ListItemButton>
          </List>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
        message="Link copied to clipboard"
      />
    </>
  );
};