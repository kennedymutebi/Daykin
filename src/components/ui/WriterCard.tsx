import React from "react";
import {
  Box,
  Avatar,
  Typography,
  Button,
  Chip,
  Stack,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import type { Writer } from "../../types";

interface WriterCardProps {
  writer: Writer;
  articles?: number;
  totalReads?: string;
  subscribers?: string;
}

const WriterCard: React.FC<WriterCardProps> = ({
  writer,
  articles = 45,
  totalReads = "4.5m",
  subscribers = "2.4k",
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      p: 2.5,
      borderRadius: 2,
      border: "1px solid",
      borderColor: "divider",
      backgroundColor: "background.default",
      "&:hover": {
        borderColor: "primary.main",
        boxShadow: "0 4px 16px rgba(229,57,53,0.1)",
      },
      transition: "all 0.2s ease",
    }}
  >
    <Box display="flex" gap={2} alignItems="flex-start">
      <Avatar
        sx={{
          bgcolor: writer.color,
          fontWeight: 700,
          width: 48,
          height: 48,
          fontSize: "1rem",
        }}
      >
        {writer.initials}
      </Avatar>
      <Box>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1rem" }}>
            {writer.name}
          </Typography>
          {writer.verified && (
            <Chip
              icon={<VerifiedIcon sx={{ fontSize: "0.75rem !important" }} />}
              label="Verified writer"
              size="small"
              sx={{
                bgcolor: "#7C3AED",
                color: "#fff",
                fontSize: "0.65rem",
                height: 20,
                "& .MuiChip-icon": { color: "#fff" },
              }}
            />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {writer.role}
        </Typography>
        <Stack direction="row" spacing={2} mt={1}>
          {[
            { label: "Subscribers", value: subscribers },
            { label: "Articles", value: String(articles) },
            { label: "Total reads", value: totalReads },
          ].map((stat) => (
            <Box key={stat.label}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Box>

    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        size="small"
        sx={{ borderColor: "#7C3AED", color: "#7C3AED", fontWeight: 600 }}
      >
        Follow
      </Button>
      <Button
        variant="outlined"
        size="small"
        sx={{ borderColor: "#7C3AED", color: "#7C3AED", fontWeight: 600 }}
      >
        Subscribe free
      </Button>
    </Stack>
  </Box>
);

export default WriterCard;