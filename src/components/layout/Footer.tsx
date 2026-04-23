import React from "react";
import { Box, Typography, Link, Stack } from "@mui/material";

const Footer: React.FC = () => (
  <Box
    component="footer"
    sx={{
      backgroundColor: "#0D0D0D",
      color: "#9E9E9E",
      py: 3,
      px: { xs: 3, md: 6 },
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 2,
    }}
  >
    <Typography variant="caption" sx={{ fontSize: "0.8rem" }}>
      © 2026 ArticleHub. All rights reserved.
    </Typography>
    <Stack direction="row" spacing={3}>
      {["Privacy", "Terms", "Contact"].map((item) => (
        <Link
          key={item}
          href="#"
          underline="hover"
          sx={{ color: "#9E9E9E", fontSize: "0.8rem" }}
        >
          {item}
        </Link>
      ))}
    </Stack>
  </Box>
);

export default Footer;