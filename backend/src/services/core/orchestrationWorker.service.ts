import cron from "node-cron";
import { eventBus, LocalEvents } from "../../config/eventBus";
import { LogisticOrder } from "../../model/LogisticOrders";
import { processBatch } from "../../orchestration/assignmentWorker";

const ORDERS_BUFFER = 20; // max orders to batch process
const BATCH_DEBOUNCE_MS = 5000; // 5 seconds

let isProcessing = false;
let pendingOrderIds: number[] = [];
let debounceTimer: NodeJS.Timeout | null = null;

function enqueueOrderForBatch(orderId: number) {
  pendingOrderIds.push(orderId);
  if (pendingOrderIds.length < ORDERS_BUFFER) return;

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    await runBatchProcessing();
  }, BATCH_DEBOUNCE_MS);
}

async function runBatchProcessing() {
  const ordersToProcess = await LogisticOrder.getPendingOrdersCount();
  if (ordersToProcess < ORDERS_BUFFER) return;

  if (isProcessing) return; // mutex to prevent concurrent runs

  isProcessing = true;

  try {
    console.log(`Running processBatch for ${ordersToProcess} orders`);
    await processBatch();
  } catch (err) {
    console.error("Error in batch processing:", err);
  } finally {
    isProcessing = false;
  }
}

export async function initOrchestrationWorker() {
  console.log("Orchestration worker initialized");
  eventBus.on(LocalEvents.NEW_ORDER, ({ order_id }) => {
    enqueueOrderForBatch(order_id);
  });

  cron.schedule("*/10 * * * *", async () => {
    console.log("Cron job triggered for batch processing");
    await runBatchProcessing();
  });

  console.log("Initial batch check on deployment");
  await runBatchProcessing();
}
