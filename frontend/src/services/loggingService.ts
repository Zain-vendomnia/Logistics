// import * as Sentry from "@sentry/react";

const isProd = process.env.MODE === "production";

export function initLoggingService() {
  if (isProd) {
    // Sentry.init({
    //   dsn: "https://your-dsn@sentry.io/project-id",
    //   integrations: [new Sentry.BrowserTracing()],
    //   tracesSampleRate: 1.0,
    // });
  }
}

type LogContext = {
  source?: string; // e.g. "component", "api", etc.
  tags?: Record<string, string>;
  extra?: Record<string, any>;
};

export function logError(error: unknown, context: LogContext = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  const logMeta = {
    source: context.source || "unknown",
    ...context.extra,
  };

  if (!isProd) {
    console.error(`[DEV LOG]`, err.message, logMeta);
    return;
  }

  // 🔹 Send to Sentry
  //   Sentry.captureException(err, {
  //     tags: context.tags,
  //     extra: logMeta,
  //   });

  // 🔹 Also send to your backend (optional)
  fetch("/api/log-error", {
    method: "POST",
    body: JSON.stringify({
      message: err.message,
      stack: err.stack,
      context: logMeta,
    }),
    headers: { "Content-Type": "application/json" },
  }).catch(console.warn); // don't break app on failure
}
