import React, { useState } from "react";
import { Box, IconButton, InputBase } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";

const SERIF = "'Playfair Display', Georgia, serif";

export interface ArticleSearchBarProps {
  placeholder?: string;
  accentColor?: string;
  onSearch?: (query: string) => void;
  sx?: object;
}

const ArticleSearchBar: React.FC<ArticleSearchBarProps> = ({
  placeholder = "Search any article here.......",
  accentColor = "#7C3AED",
  onSearch,
  sx = {},
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSearch = () => {
    if (query.trim()) onSearch?.(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // Surfaces flip between dark translucent and light translucent
  const borderIdle    = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const bgFocused     = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const bgIdle        = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: "10px",
        border: focused ? `1px solid ${accentColor}88` : `1px solid ${borderIdle}`,
        background: focused ? bgFocused : bgIdle,
        transition: "border-color 0.2s, background 0.2s",
        px: 1.5,
        py: 0.5,
        ...sx,
      }}
    >
      <InputBase
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        sx={{
          fontFamily: SERIF,
          fontSize: "0.88rem",
          // Typed text color
          color: theme.palette.text.primary,
          "& ::placeholder": {
            color: theme.palette.text.disabled,
            opacity: 1,
          },
        }}
      />
      <IconButton
        size="small"
        onClick={handleSearch}
        sx={{
          color: focused ? accentColor : theme.palette.text.disabled,
          transition: "color 0.2s",
          p: 0.5,
          "&:hover": { color: accentColor },
        }}
      >
        <SearchIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
};

export default ArticleSearchBar;