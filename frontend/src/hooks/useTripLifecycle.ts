import { useEffect, useState } from "react";

import { useDeliveryStore } from "../store/useDeliveryStore";
import { DeliveryScenario } from "../components/delivery/delieryScenarios";

export const useTripLifecycle = () => {
  const store = useDeliveryStore();
  const {
    tripData,
    deliveryCompleted,
    ordersDeliveredSuccessfully,
    ordersReturnToWareHouse,
    deliveryId,
    scenarioKey,
    setScenario,
    addOrdersDeliveredSuccessfully,
    setDeliveryCompleted,
  } = store;

  const [isDeliveryStarted, setIsDeliveryStarted] = useState(false);
  const [isReachedToDestination, setIsReachedToDestination] = useState(true);

  const startNewTrip = async () => {
    const currentOrderId = tripData?.orderId;

    const isTripHandled =
      currentOrderId &&
      (store.ordersDeliveredSuccessfully.includes(currentOrderId) ||
        store.ordersReturnToWareHouse.includes(currentOrderId));

    const shouldLoadNewTrip =
      deliveryCompleted === true || !tripData || isTripHandled;

    if (shouldLoadNewTrip) {
      store
        .fetchTripData()
        .then((data) => {
          setIsDeliveryStarted(false);
          // Avoid adding newTrip data to OrdersDelivered Array
          store.setDeliveryCompleted(false);
          store.resetDeliveryState();
          store.resetActionsCompleted();
          console.log("🚚 New Order Id:: ", data.orderId);

          data.hasPermit === true
            ? store.setScenario(data.orderId, DeliveryScenario.hasPermit)
            : store.setScenario(data.orderId, DeliveryScenario.foundCustomer);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }
  };

  const handleDriverReachedToDestination = () => {
    setIsReachedToDestination(true);
    setIsDeliveryStarted(true);
    store.updateDeliveryState({ driverReachedToLocation: true });
  };

  const handleOrderComplete = () => {
    const signatureCaptured =
      store.actionsCompleted.captureCustomerSignature ||
      store.actionsCompleted.captureNeighborSignature;

    if (scenarioKey === DeliveryScenario.hasPermit || signatureCaptured) {
      addOrdersDeliveredSuccessfully(store.deliveryId);
      setDeliveryCompleted(true);
    }
  };

  const handleOrderReturn = () => {
    if (
      store.deliveryState.noAcceptance === true &&
      store.deliveryState.deliveryReturnReason &&
      store.actionsCompleted.returnToWarehouse === true
    ) {
      console.log("handleOrderReturn Conditions fulfilled");
      store.addOrdersReturnToWareHouse(store.deliveryId);
      store.setDeliveryCompleted(true);
    }
  };

  useEffect(() => {
    if (tripData && !deliveryCompleted) {
      tripData.hasPermit === true
        ? setScenario(deliveryId, DeliveryScenario.hasPermit)
        : setScenario(deliveryId, DeliveryScenario.foundCustomer);
    }
  }, [
    tripData,
    deliveryId,
    deliveryCompleted,
    ordersDeliveredSuccessfully,
    ordersReturnToWareHouse,
  ]);

  useEffect(() => {
    startNewTrip();
    console.log("🚚 Delivery#: ", store.deliveryInstanceKey);
    console.log("🚚 Order Id: ", deliveryId);
    console.log(
      "🚚 Orders Delivered Successfully:",
      ordersDeliveredSuccessfully
    );
  }, [deliveryCompleted, deliveryId]);

  return {
    isDeliveryStarted,

    isReachedToDestination,

    startNewTrip,
    handleDriverReachedToDestination,
    handleOrderComplete,
    handleOrderReturn,
  };
};
