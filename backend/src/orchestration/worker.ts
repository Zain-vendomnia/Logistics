import { eventBus, LocalEvents } from "../config/eventBus";
import { processBatch } from "./assignmentWorker";

const DEBOUNCE_MS = 1 * 60 * 1000; // 1 minutes
let debounceTimer: NodeJS.Timeout | null = null;

let isFlushing = false;
let OrdersInQueue = new Set<number>();

interface Metrics {
  flushType: "HIGH" | "NORMAL";
  ordersCounts?: number;
  processingOrders: string;
  durationMs: number;
  error?: string;
}
const flushMetrics: Metrics[] = [];

eventBus.on(
  LocalEvents.NEW_ORDER,
  async (payload: { order_id: number; priority: "high" | "normal" }) => {
    const { order_id, priority } = payload;
    OrdersInQueue.add(order_id);

    if (priority === "high") {
      console.log(`[HIGH] Immediate flush triggered for order ${order_id}`);
      await flushBatchImmediate("HIGH");
    } else {
      console.log(`[NORMAL] Order ${order_id} added to pending buffer`);
      scheduleDebounce();
    }
  }
);

function scheduleDebounce() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    flushBatchImmediate("NORMAL").catch((err) =>
      console.error("Debounced flush failed:", err)
    );
  }, DEBOUNCE_MS);
}

async function flushBatchImmediate(flushType: "HIGH" | "NORMAL") {
  if (isFlushing && OrdersInQueue.size < 5) {
    console.log("Flush already in progress, skipping.");
    return;
  }

  isFlushing = true;

  const startTime = Date.now();

  try {
    await processBatch();

    const duration = Date.now() - startTime;
    flushMetrics.push({
      flushType,
      ordersCounts: OrdersInQueue.size,
      processingOrders: Array.from(OrdersInQueue).join(", "),
      durationMs: duration,
    });

    console.log(
      `[${flushType}] Flush complete. Orders processed: ${Array.from(
        OrdersInQueue
      ).join(", ")}, duration: ${duration}ms`
    );

    OrdersInQueue.clear();
  } catch (err: any) {
    const duration = Date.now() - startTime;
    flushMetrics.push({
      flushType,
      processingOrders: Array.from(OrdersInQueue).join(", "),
      durationMs: duration,
      error: err.message,
    });
    console.error(`[${flushType}] Global flush failed:`, err);
  } finally {
    isFlushing = false;
  }
}
