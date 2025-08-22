import React from "react";
import { Box, lighten, Typography, useTheme } from "@mui/material";

interface Props {
  label: string;
  color?: "primary" | "info" | "error" | "warning" | "success" | string;
  variant?: "contained" | "outlined";
}

const XChip = ({ label, color = "primary", variant = "contained" }: Props) => {
  const theme = useTheme();

  const pickColor = (clr: string) => {
    switch (clr) {
      case "primary":
        return theme.palette.primary.main;
      case "info":
        return theme.palette.info.main;
      case "error":
        return theme.palette.error.main;
      case "warning":
        return theme.palette.warning.main;
      case "success":
        return theme.palette.success.main;
      default:
        return clr;
    }
  };

  const bColor = pickColor(color);
  const bgColor = lighten(bColor, variant === "contained" ? 0.3 : 0.85);

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.5,
        borderRadius: "999px",
        border: `1px solid ${bColor}`,
        bgcolor: bgColor,
        color: variant === "contained" ? "#fff" : bColor,
        fontWeight: 400,
        // height: 30,
      }}
    >
      <Typography variant="subtitle2" sx={{ lineHeight: 1 }}>
        {label}
      </Typography>
    </Box>
  );
};

export default XChip;
