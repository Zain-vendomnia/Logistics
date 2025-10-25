import app from "./app";
import logger from "./config/logger";
import { initSocket } from "./config/socket";  // Changed path
import { initWhatsAppSocket } from "./socket/Whatsapp.socket";  // Added import
import { emitAppConnection } from "./socket/logging.socket";  // Added import
import { runInitialDbSetup } from "./services/core/dbSetupService";
import { runInitialSyncs } from "./services/core/syncService";
import { scheduleRecurringSyncs } from "./services/core/scheduleService";

async function main() {
  try {
    const server = initSocket(app);
    initWhatsAppSocket();  // Add this line - initialize WhatsApp socket

    server.listen(app.get("port"), async () => {
      emitAppConnection("connected");
      logger.info(`Server is running on port ${app.get("port")}`);

      logger.info("Running initial database setup...");
      await runInitialDbSetup();
      logger.info("Database setup completed.");

      await runInitialSyncs();
      scheduleRecurringSyncs();
    });
  } catch (error: any) {
    logger.error(`Startup error: ${error.message || error}`);
    emitAppConnection("disconnected");
    process.exit(1);
  }
}

main();