// src/components/shared/ShareMenu.tsx
// The actual share menu — WhatsApp / X / Facebook / Telegram / Copy Link,
// plus a native "Share Image" option on browsers that support the Web Share
// API with files (mostly mobile Chrome/Safari).
//
// The counter only bumps once the person actually uses the link (platform
// opened, link copied, or the native share sheet completes) — see onShared —
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
import ImageIcon from "@mui/icons-material/Image";

interface ShareMenuProps {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
  title: string;
  /** Article image, if any — enables the native "Share Image" option below. */
  imageUrl?: string;
  /** Called once, only when the link/image is actually used (platform opened, copied, or native share completed). */
  onShared: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ open, onClose, shareUrl, title, imageUrl, onShared }) => {
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

  // Only offer this when there's actually an image AND the browser supports
  // sharing files via the Web Share API (canShare with a `files` payload).
  // Desktop Chrome/Firefox generally don't — the option simply won't render there.
  const supportsFileShare =
    !!imageUrl &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function";

  const handleShareImage = async () => {
    if (!imageUrl || typeof navigator.share !== "function") return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], "article.jpg", { type: blob.type || "image/jpeg" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, text: title, url: shareUrl, files: [file] });
        onShared();
        onClose();
      }
    } catch {
      // User cancelled the native share sheet, or the fetch/share call
      // failed — no fallback needed, the dialog just stays open with the
      // other options still available.
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
            {supportsFileShare && (
              <ListItemButton onClick={handleShareImage}>
                <ListItemIcon><ImageIcon /></ListItemIcon>
                <ListItemText primary="Share Image" />
              </ListItemButton>
            )}
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