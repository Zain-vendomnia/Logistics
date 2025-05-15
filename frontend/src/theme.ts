
import { createTheme, PaletteColor, ThemeOptions } from "@mui/material/styles";
// import { PaletteOptions } from "@mui/material/styles/createPalette";
// theme.ts

// Extend PaletteColor to support 'gradient'
declare module "@mui/material/styles/createPalette" {
  interface PaletteColor {
    gradient?: string;
    headerGradient?: string;
  }

  interface SimplePaletteColorOptions {
    gradient?: string;
    headerGradient?: string;
  }

  interface PaletteOptions {
    greyedOut?: {
      default: string;
    };
  }

  interface Palette {
    greyedOut?: {
      default: string;
    };
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      light: "#faa819",
      main: "#f7941d",
      dark: "#f37021",
      gradient: "linear-gradient(45deg, #f7941d 30%, #f37021 90%)",
      headerGradient: "linear-gradient(45deg, #f37620 30%, #ed6508 90%)",
      contrastText: "#FFFFFF",
    },
    secondary: {
      light: "#1e91d0",
      main: "#00509d",
      dark: "#003f88",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#f5f5f5",
    },
    greyedOut: {
      default: "#00296b",
    },
    action: {
      disabled: "#FFFFFF",
      disabledBackground: "#A9A9A9",
    },
  },
  typography: {
    fontFamily: "'Roboto', sans-serif",
    h1: { fontSize: "2rem", fontWeight: 600 },
    h2: { fontSize: "1.8rem", fontWeight: 600 },
    h3: { fontSize: "1.5rem", fontWeight: 500 },
    body1: { fontSize: "1rem" },
  },
  components: {
    MuiContainer: {
      defaultProps: {
        maxWidth: "lg",
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          display: "flex",
          flexWrap: "wrap",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => {
          const isContained = ownerState.variant === "contained";
          const isOutlined = ownerState.variant === "outlined";

          const getPaletteColor = (colorKey: string): PaletteColor => {
            const palette =
              theme.palette[colorKey as keyof typeof theme.palette];
            if (typeof palette === "object" && palette && "main" in palette) {
              return palette as PaletteColor;
            }
            return theme.palette.primary as PaletteColor; // fallback
          };

          const palette = getPaletteColor(ownerState.color || "primary");

          return {
            textTransform: "none",
            fontWeight: 500,
            fontSize: "1rem",
            padding: "6px 16px",
            letterSpacing: 0.25,
            borderRadius: theme.shape.borderRadius * 2,
            transition: "all 0.2s ease-in-out",

            [theme.breakpoints.down("lg")]: {
              fontSize: "1.05rem",
              letterSpacing: 0.5,
              padding: "8px 18px",
            },

            color: isContained ? palette.contrastText : palette.main, // contained = white text, outlined = colored text
            backgroundColor: isContained ? palette.main : "transparent", // outlined = no background initially
            border: isOutlined ? `1px solid ${palette.main}` : undefined, // outlined = colored border

            "&:hover": {
              backgroundColor: palette.dark, // both contained/outlined get dark background on hover
              color: palette.contrastText,
              border: isOutlined ? `1px solid ${palette.dark}` : undefined, // outlined button border also darkens
            },
            "&:focus, &:active": {
              backgroundColor: palette.dark,
              color: palette.contrastText,
              border: isOutlined ? `1px solid ${palette.dark}` : undefined,
            },

            // 🛠 Very important: AFTER hover/focus/active, outlined must reset back to transparent
            "&:not(:hover):not(:focus):not(:active)": isOutlined
              ? {
                  
                  color: palette.contrastText,
                  border: `1px solid ${palette.main}`,
                }
              : {},
          };
        },
      },
    },
  },

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1281,
      xl: 1920,
    },
  },
};

const theme = createTheme(themeOptions);
export default theme;
