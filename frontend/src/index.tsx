import { CssBaseline, ThemeProvider } from "@mui/material";
import ReactDOM from "react-dom/client";
import theme from "./theme";

import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { AppProviders } from "./providers/AppProviders";
import { initLoggingService } from "./services/loggingService";

initLoggingService();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <AppProviders>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </AppProviders>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
