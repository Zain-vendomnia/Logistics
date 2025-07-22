import { logError } from "../services/loggingService";

export function registerGlobalErrorHandlers() {
  window.onerror = (message, source, lineno, colno, error) => {
    // console.error("Global JS Error:", { message, source, lineno, colno, error });
    logError(error || message, {
      source: "window.onerror",
      extra: { source, lineno, colno },
    });
  };

  window.onunhandledrejection = (event) => {
    // console.error("Unhandled Promise Rejection:", event.reason);
    logError(event.reason, {
      source: "window.onunhandledrejection",
    });
  };
}
