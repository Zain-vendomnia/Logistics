import { createTheme, ThemeOptions } from "@mui/material/styles";
// import { PaletteOptions } from "@mui/material/styles/createPalette";

declare module "@mui/material/styles/createPalette" {
  interface PaletteOptions {
    greyedOut?: {
      default: string;
    };
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      light: "#faa819", // #ffb51d",
      main: "#f7941d",
      dark: "#f37021",
      contrastText: "#FFFFFF",
    },
    secondary: {
      light: "#1e91d0", // 1a76bc",
      main: "#00509d", // Yellow from logo: f1cb3a",
      dark: "#003f88", // even darker: "#00296b"
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#f5f5f5",
    },
    greyedOut: {
      default: "#00296b",
    },
    action: {
      disabled: "#FFFFFF", // Set disabled text/icons color
      disabledBackground: "#A9A9A9", // Set disabled background color
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
        disableElevation: true, // Optional: removes box-shadow by default
      },
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          textTransform: "none",
          fontWeight: 500,
          fontSize: "1rem", // default for md and up
          padding: "6px 16px",
          letterSpacing: 0.25,
          transition: "all 0.2s ease-in-out",
          borderRadius: theme.shape.borderRadius * 2,

          // Responsive: md and below
          [theme.breakpoints.down("lg")]: {
            fontSize: "1.05rem",
            letterSpacing: 0.5,
            padding: "8px 18px",
          },

          // Custom hover styles
          "&:hover": {
            backgroundColor:
              ownerState.color === "primary"
                ? theme.palette.primary.dark
                : ownerState.color === "secondary"
                  ? theme.palette.secondary.dark
                  : theme.palette.action.hover,
            color: "#fff",
            textDecoration: "none",
          },

          // Keep color consistent on focus/active (especially for Link buttons)
          "&:focus, &:active": {
            color: "#fff",
            textDecoration: "none",
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
