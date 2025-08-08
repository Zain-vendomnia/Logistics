export function logWithTime(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}
