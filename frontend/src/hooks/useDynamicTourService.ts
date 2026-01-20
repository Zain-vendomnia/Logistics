import { useEffect, useRef, useState } from "react";
import { useTheme, Theme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material";
import {
  CreateTour_Req,
  DynamicTourPayload,
  DynamicTourRes,
  rejectTour_Req,
  UnassignedRes,
} from "../types/tour.type";
import adminApiService from "../services/adminApiService";
import { Driver, Warehouse } from "../types/warehouse.type";
import { getAvailableDrivers } from "../services/driverService";
import useDynamicTourStore from "../store/useDynamicTourStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../store/useNotificationStore";
import { getCurrentUser } from "../services/auth.service";
import { Order } from "../types/order.type";

export const useDynamicTourService = () => {
  const { showNotification } = useNotificationStore();
  const {
    selectedTour,
    setSelectedTour,
    dynamicToursList,
    setDynamicToursList,
    updateDynamicToursList,
    pinboard_removeOrders,
    dtoursOrders,
    updateDToursOrders,
  } = useDynamicTourStore();

  const theme = useTheme<Theme>();

  const [loading, setLoading] = useState(false);

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const [shouldUpdateTourRoute, setShouldUpdateTourRoute] = useState(false);

  const [selectedPinbOrders, setSelectedPinbOrders] = useState<Order[]>([]);
  const [ordersToRemove, setOrdersToRemove] = useState<Order[]>([]);

  // for Order details - expanded
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const orderRef = useRef<HTMLDivElement | null>(null);

  const [removeOrderId, setRemoveOrderId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Form fields states
  const today = new Date().toISOString().split("T")[0];
  const initialFormState = {
    driverId: "",
    tourDate: today,
    startTime: "07:30",
    routeColor: theme.palette.primary.light,
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchEligibleDrivers = async (date: string) => {
    if (!selectedTour) return;
    try {
      const res = await getAvailableDrivers(
        date,
        selectedTour.warehouse_id ?? 0,
      );

      const availableDrivers = res.available || [];

      const unavailableDrivers = (res.unavailable || []).map((item: any) => ({
        id: item.driver.id,
        name: item.driver.name,
        status: 0,
        reason: item.reason,
      }));

      setDrivers([...availableDrivers, ...unavailableDrivers]);
    } catch (err) {
      console.error("Failed to fetch eligible drivers:", err);
      setDrivers([]);
    }
  };

  // Set Should Update TourRoute
  useEffect(() => {
    if (!selectedTour) return;

    const selectedTourOrdersIds = selectedTour.orderIds
      .split(",")
      .map((id) => Number(id));

    // Check if tourOrders have been changed
    const tourChanged = selectedTourOrdersIds.some(
      (to_id) => !tourOrders.find((o) => o.order_id === to_id),
    );
    // Or if any new pinboard orders are selected
    const newPinboardOrdersAdded = selectedPinbOrders.length > 0;

    setShouldUpdateTourRoute(tourChanged || newPinboardOrdersAdded);
  }, [tourOrders, selectedPinbOrders, selectedTour]);

  // Fetch eligible warehouse drivers
  // TEMP
  // useEffect(() => {
  //   fetchEligibleDrivers(formData.tourDate);
  // }, [selectedTour?.warehouse_id, formData.tourDate]);

  // Fetch Selected Tour Details and Orders
  useEffect(() => {
    if (!selectedTour) return;

    const fetchData = async () => {
      try {
        // get warehouse details
        const warehouseRes: Warehouse = await adminApiService.getWarehouse(
          selectedTour.warehouse_id,
        );
        setWarehouse(warehouseRes);

        // get Tour Orders
        const orderIds = selectedTour.orderIds;
        const order_ids = orderIds.split(",").map(Number);

        const persistedOrders = dtoursOrders;

        const persistedMap = new Map(
          persistedOrders.map((o) => [o.order_id, o]),
        );

        const foundOrders: Order[] = [];
        const missingIds: number[] = [];

        order_ids.forEach((id) => {
          if (persistedMap.has(id)) {
            foundOrders.push(persistedMap.get(id)!);
          } else {
            missingIds.push(id);
          }
        });

        let fetchedOrders: Order[] = [];

        if (missingIds.length) {
          console.log(
            `[DTours] Fetching missing orders for 
            selected tour ${selectedTour.tour_name},
            orderIds: ${missingIds}`,
          );
          fetchedOrders = await adminApiService.fetchOrdersWithItems(
            missingIds.join(","),
          );
          // Update store for persistence
          updateDToursOrders(fetchedOrders);
        }

        // Merge found + fetched
        const orders = [...foundOrders, ...fetchedOrders];
        // setTourOrders(orders);
        const filtered = orders.filter((o) => !selectedPinbOrders.includes(o));
        setTourOrders(filtered);

        setShouldUpdateTourRoute(false);
        setLoading(false);
      } catch (error) {
        throw Error("error fetching tour details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setSelectedPinbOrders([]);
    setOrdersToRemove([]);
    setFormData(initialFormState);
  }, [selectedTour]);

  // Set OrderRef to show order details - expanded
  useEffect(() => {
    if (!selectedOrderId || !orderRef.current) return;
    orderRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedOrderId]);

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleOrderRemove = (
    type: "torders" | "porders",
    orderId: number | string,
  ) => {
    if (orderId == null) return;

    if (type === "torders") {
      setTourOrders((prev) =>
        prev.filter((order) => order.order_id !== orderId),
      );
    } else if (type === "porders") {
      setSelectedPinbOrders((prev) =>
        prev.filter((order) => order.order_id !== orderId),
      );
    }
    setRemoveOrderId(null);
  };

  const restoreRemovedOrder = (reqOrder: Order) => {
    const exist = ordersToRemove.some((o) => o.order_id === reqOrder.order_id);
    if (exist) {
      setOrdersToRemove((prev) =>
        prev.filter((o) => o.order_id !== reqOrder.order_id),
      );

      const exist_selectedOrderIds = selectedTour?.orderIds
        .split(",")
        .map(Number)
        .includes(reqOrder.order_id);
      if (exist_selectedOrderIds) {
        setTourOrders((prev) => [...prev, reqOrder]);
        return;
      }
    }
  };

  const handleSelectPinbOrder = async (newValue: Order[]) => {
    if (newValue.length === 0) {
      setSelectedPinbOrders([]);
      return;
    }
    console.log("PinB_Orders_Select Ids", newValue);
    const orderIds = newValue.map((o) => o.order_id).join(",");

    console.log("PinB_Orders_Select Ids", orderIds);

    const orders: Order[] =
      await adminApiService.fetchOrdersWithItems(orderIds);

    setSelectedPinbOrders(orders);
  };

  const pinboardOrderSearch = async (search_order: any) => {
    if (!search_order) return;

    console.log("pinboardOrderSearch order: ", search_order);

    const orders: Order[] = await adminApiService.fetchOrdersWithItems(
      search_order.order_id.toString(),
    );
    setSelectedPinbOrders(orders);
  };

  // Tour modification functions
  const handleFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateDynamicTour = async () => {
    setLoading(true);

    try {
      const torders = tourOrders.map((o) => o.order_id.toString()).join(",");
      const porders = selectedPinbOrders
        .map((o) => o.order_id.toString())
        .join(",");

      const request: DynamicTourPayload = {
        ...selectedTour!,
        tour_route: null,
        orderIds: [torders, porders].filter(Boolean).join(","),
        updated_by: getCurrentUser().email,
      };
      // console.log("Update D-Tour Request: ", request);

      const dTour_res: DynamicTourRes =
        await adminApiService.requestDynamicTour(request);
      // console.log("Update D-Tour Response: ", dTour_res);

      if (!dTour_res || !dTour_res.dynamicTour) {
        throw new Error("Invalid response: missing dynamicTour");
      }
      const updated_dTour = dTour_res.dynamicTour;
      console.log("updated_dTour", updated_dTour);
      updateDynamicToursList(updated_dTour);
      setSelectedTour({ ...updated_dTour });

      pinboard_removeOrders(updated_dTour.orderIds.split(",").map(Number));

      const updatedOrders = updated_dTour.orderIds.split(",").map(Number);
      const trueOrders = [
        ...tourOrders.filter((o) => updatedOrders.includes(o.order_id)),
        ...selectedPinbOrders.filter((o) => updatedOrders.includes(o.order_id)),
      ];
      setTourOrders(trueOrders);
      setSelectedPinbOrders([]);

      if (dTour_res.unassigned) {
        notifyUnassignedOrders(dTour_res.unassigned);
        const unassignedOrderIds = new Set(
          dTour_res.unassigned.map((u) => u.orderId),
        );

        setTourOrders((prev) =>
          prev.filter((o) => !unassignedOrderIds.has(o.order_id)),
        );
      }

      adminApiService
        .fetchOrdersWithItems(updated_dTour.orderIds)
        .then((freshOrders) => {
          setTourOrders(freshOrders);
        })
        .catch((error) => {
          console.error("Background fetch of tour orders failed:", error);
        });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Original error:", error);
        throw new Error("Error while creating new tour route", {
          cause: error,
        });
      } else {
        console.error("Unknown error:", error);
        throw new Error("Error while creating new tour route");
      }
    } finally {
      setLoading(false);
    }
  };

  // Accept Dynamic Tour
  const handleTourSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("Current Warehouse...", warehouse);

    console.log("Submitting Dynamic Tour...", e);

    setLoading(true);

    try {
      // Collect order IDs from selected lists
      const torders = tourOrders.map((o) => o.order_id);

      // Build request payload
      const request: CreateTour_Req = {
        dTour_id: selectedTour?.id,
        dTour_name: selectedTour?.tour_name,
        ...formData, // tourDate, startTime, driverId, routeColor
        driverId: Number(formData.driverId),
        comments: "",
        orderIds: torders,
        warehouseId: warehouse?.id!, // ensure from warehouse service
        userId: getCurrentUser().email, // service helper
      };

      console.log("Accept D-Tour Request:", request);

      // API call
      const res = await adminApiService.acceptDynamicTour(request);
      console.log("Accept D-Tour Response:", res);

      const updated_dTourList = dynamicToursList.filter(
        (dt) => dt.id !== request.dTour_id,
      );
      setDynamicToursList(updated_dTourList);

      showNotification({
        message: `Tour ${res.tourName} created successfully`,
        severity: NotificationSeverity.Success,
        duration: 8000,
      });
    } catch (error: unknown) {
      console.error("Error Accepting Tour:", error);
      showNotification({
        message: "Error Accepting Tour",
        severity: NotificationSeverity.Error,
        duration: 8000,
      });
    } finally {
      setSelectedTour(null);
      setSelectedPinbOrders([]);
      setLoading(false);
    }
  };

  const handleTourReject = async (reason: string) => {
    setLoading(true);

    try {
      const request: rejectTour_Req = {
        tour_id: selectedTour?.id!,
        userId: getCurrentUser().email,
        reason,
      };

      const res = await adminApiService.rejectDynamicTour(request);
      console.log("Reject D-Tour Response:", res);

      const updated_dTourList = dynamicToursList.filter(
        (dt) => dt.id !== request.tour_id,
      );
      setDynamicToursList(updated_dTourList);

      showNotification({
        message: "Tour Rejected Successfully",
        severity: NotificationSeverity.Success,
      });
    } catch (error: unknown) {
      console.error("Error Rejecting Tour:", error);
      showNotification({
        message: "Error Rejecting Tour",
        severity: NotificationSeverity.Error,
      });
    } finally {
      setSelectedTour(null);
      setSelectedPinbOrders([]);
      setLoading(false);
    }
  };

  // Side functions
  const notifyUnassignedOrders = (unassigned: UnassignedRes[]) => {
    if (!unassigned.length) return;

    unassigned.forEach((un) => {
      const reasons = un.reasons.map((r: string) => r.split(":")[1]).join("\n");

      showNotification({
        title: un.order_number ?? "Unknown Order",
        message: reasons || "Unassigned without reason",
        severity: NotificationSeverity.Warning,
        duration: 12000,
      });
    });
  };

  return {
    showRejectModal,
    setShowRejectModal,
    loading,

    warehouse,
    drivers,
    tourOrders,
    ordersToRemove,
    shouldUpdateTourRoute,
    setShouldUpdateTourRoute,

    selectedPinbOrders,
    handleSelectPinbOrder,

    removeOrderId,
    setRemoveOrderId,
    // orderToDelete,
    handleOrderRemove,
    restoreRemovedOrder,

    handleOrderSelect,

    formData,
    today,
    theme,

    handleFormChange,
    handleTourSubmit,
    handleTourReject,
    updateDynamicTour,

    pinboardOrderSearch,

    orderRef,
  };
};
