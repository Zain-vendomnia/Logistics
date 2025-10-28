import { emitEvent } from "../config/socket";

/**
 * Emit app connection status to all clients
 * @param status - Connection status (connected or disconnected)
 */
export const emitAppConnection = (status: "connected" | "disconnected") =>
  emitEvent("app-connection", {
    status,
    timestamp: new Date().toISOString(),
  });

/**
 * Emit logging message to all clients
 * @param message - Log message to broadcast
 */
export const emitLogging = (message: string) =>
  emitEvent("log-message", { 
    message, 
    timestamp: new Date().toISOString() 
  });

/**
 * Emit task progress update to all clients
 * @param task - Task name or identifier
 * @param progress - Progress value (typically 0-100)
 * @param details - Additional task details
 */
export const emitProgress = (task: string, progress: number, details?: any) =>
  emitEvent("task-progress", {
    task,
    progress,
    details,
    timestamp: new Date().toISOString(),
  });