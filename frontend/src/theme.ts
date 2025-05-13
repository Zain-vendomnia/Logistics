// theme.ts
import { createTheme, ThemeOptions } from "@mui/material/styles";

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
      headerGradient:"linear-gradient(45deg, #f37620 30%, #ed6508 90%)",
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
      defaultProps: {
        color: "primary",
      },
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor:
              ownerState.color === "primary"
                ? "#fff"
                : theme.palette.primary.dark,
            color:
              ownerState.color === "primary"
                ? theme.palette.primary.dark
                : "#fff",
          },
        }),
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
