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
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
};

const theme = createTheme(themeOptions);
export default theme;
