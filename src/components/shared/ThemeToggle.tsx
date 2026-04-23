import React from "react";
import { useTheme } from "@mui/material/styles";
import { IconButton, Tooltip } from "@mui/material";
import { useThemeMode } from "../../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const theme = useTheme();
  const { isDark, toggle } = useThemeMode();

  return (
    <Tooltip title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <IconButton
        onClick={toggle}
        aria-label="toggle colour mode"
        sx={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.gold.main}40`,
          color: theme.palette.gold.main,
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: `${theme.palette.gold.main}18`,
            borderColor: theme.palette.gold.main,
            transform: "rotate(20deg)",
          },
        }}
      >
        {isDark ? (
          // Sun — clicking will bring light
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7zm0-5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zm10-9a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2h1zM4 11a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2h1zm14.66-6.07a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0zM7.05 17.66a1 1 0 0 1 0 1.41l-.71.71a1 1 0 0 1-1.41-1.41l.71-.71a1 1 0 0 1 1.41 0zm11.32 0a1 1 0 0 1 1.41 0l.71.71a1 1 0 0 1-1.41 1.41l-.71-.71a1 1 0 0 1 0-1.41zM5.64 4.93a1 1 0 0 1 1.41 0l.71.71A1 1 0 0 1 6.35 7.05l-.71-.71a1 1 0 0 1 0-1.41z"/>
          </svg>
        ) : (
          // Moon — clicking will bring dark
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/>
          </svg>
        )}
      </IconButton>
    </Tooltip>
  );
};