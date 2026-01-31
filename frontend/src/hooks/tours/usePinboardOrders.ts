import { useCallback, useEffect, useState } from "react";
import { Order } from "../../types/order.type";
import { tourService } from "../../services/tour.service";

export const usePinboardOrders = () => {
  const [pinboardOrders, setPinboardOrders] = useState<Order[]>([]);
  const lastFetchedAt: number | null = null;
  const [selectedPinbOrders, setSelectedPinbOrders] = useState<Order[]>([]);

  const loadPinboardOrders = useCallback(async () => {
    // setIsLoading(true);
    try {
      const now = Date.now();
      const staleAfter = 30 * 60 * 1000; // 30 minutes
      const isStale = !lastFetchedAt || now - lastFetchedAt > staleAfter;

      if (pinboardOrders.length === 0 || isStale) {
        const orders: Order[] =
          await tourService.getPinboardOrders(lastFetchedAt);

        if (orders.length) {
          const existingIds = new Set(pinboardOrders.map((o) => o.order_id));
          const newOrders = orders.filter((o) => !existingIds.has(o.order_id));
          setPinboardOrders(newOrders);
        }
      }
    } catch (err) {
      console.error("Failed to fetch pinboard Orders", err);
    }
    //  finally {
    //   setIsLoading(false);
    // }
  }, [pinboardOrders.length]);

  useEffect(() => {
    loadPinboardOrders();
  }, []);

  const handleSelectPinbOrder = async (newValue: Order[]) => {
    if (newValue.length === 0) {
      setSelectedPinbOrders([]);
      return;
    }
    const orderIds = newValue.map((o) => o.order_id);

    const pOrders = pinboardOrders.filter((po) =>
      orderIds.includes(po.order_id),
    );

    setSelectedPinbOrders(pOrders);
  };

  return {
    pinboardOrders,
    selectedPinbOrders,
    setSelectedPinbOrders,
    handleSelectPinbOrder,
  };
};
