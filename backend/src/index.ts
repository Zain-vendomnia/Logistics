import app from "./app";
import logger from "./config/logger";
import { emitAppConnection, initSocket } from "./config/socket";
import { runInitialDbSetup } from "./services/core/dbSetupService";
import { runInitialSyncs } from "./services/core/syncService";
import { scheduleRecurringSyncs } from "./services/core/scheduleService";
import { initOrchestrationWorker } from "./services/core/orchestrationWorker.service";

async function main() {
  try {
    const server = initSocket(app);

    server.listen(app.get("port"), async () => {
      emitAppConnection("connected");
      logger.info(`Server is running on port ${app.get("port")}`);

      logger.info("Running initial database setup...");
      await runInitialDbSetup();
      logger.info("Database setup completed.");

      await runInitialSyncs();
      scheduleRecurringSyncs();
      await initOrchestrationWorker();
    });
  } catch (error: any) {
    logger.error(`Startup error: ${error.message || error}`);
    emitAppConnection("disconnected");
    process.exit(1);
  }
}

main();
