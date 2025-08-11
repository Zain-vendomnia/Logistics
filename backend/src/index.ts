import app from "./app";
import { initSocket } from "./socket";
import { runInitialDbSetup } from "./services/core/dbSetupService";
import { runInitialSyncs } from "./services/core/syncService";
import { scheduleRecurringSyncs } from "./services/core/scheduleService";
import { logWithTime } from "./utils/logging";

async function main() {
  try {
    logWithTime("Running initial database setup...");
    await runInitialDbSetup();
    logWithTime("Database setup completed.");

    const server = initSocket(app);
    server.listen(app.get("port"), async () => {
      logWithTime(`Server is running on port ${app.get("port")}`);

      await runInitialSyncs();
      scheduleRecurringSyncs();
    });
  } catch (error) {
    logWithTime("Startup error:");
    console.error(error);
    process.exit(1);
  }
}

main();
