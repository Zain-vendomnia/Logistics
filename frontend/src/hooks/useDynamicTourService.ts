import { useEffect, useRef, useState } from "react";
import { useTheme, Theme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material";
import {
  CreateTour_Req,
  DynamicTourPayload,
  DynamicTourRes,
  rejectDynamicTour_Req,
  UnassignedRes,
} from "../types/tour.type";
import adminApiService from "../services/adminApiService";
import { Driver, WarehouseDetails } from "../types/dto.type";
import { getAvailableDrivers } from "../services/driverService";
import useDynamicTourStore from "../store/useDynamicTourStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../store/useNotificationStore";
import { getCurrentUser } from "../services/auth.service";
import { Order } from "../types/order.type";

const getOrders = () => [
  { id: 1, name: 213 },
  { id: 2, name: 214 },
  { id: 3, name: 215 },
  { id: 4, name: 216 },
  { id: 5, name: 217 },
  { id: 6, name: 218 },
  { id: 7, name: 219 },
  { id: 8, name: 220 },
  { id: 9, name: 221 },
  { id: 11, name: 222 },
  { id: 12, name: 223 },
  { id: 13, name: 224 },
];

export const useDynamicTourService = () => {
  const { showNotification } = useNotificationStore();
  const { selectedTour, setSelectedTour } = useDynamicTourStore();

  const theme = useTheme<Theme>();

  const [loading, setLoading] = useState(false);

  const [warehouse, setWarehouse] = useState<WarehouseDetails | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const [shouldUpdateTourRoute, setShouldUpdateTourRoute] = useState(false);

  const [selectedPinbOrders, setSelectedPinbOrders] = useState<Order[]>([]);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  // const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [removeOrderId, setRemoveOrderId] = useState<number | null>(null);

  const [showRejectModal, setShowRejectModal] = useState(false);

  const orderRef = useRef<HTMLDivElement | null>(null);

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
        selectedTour.warehouse_id ?? 0
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

    const selectedTourOrders = selectedTour.orderIds
      .split(",")
      .map((id) => Number(id));

    // Check if tourOrders have been changed
    const tourChanged = selectedTourOrders.some(
      (to) => !tourOrders.find((o) => o.order_id === to)
    );
    // Or if any new pinboard orders are selected
    const newPinboardOrdersAdded = selectedPinbOrders.length > 0;

    setShouldUpdateTourRoute(tourChanged || newPinboardOrdersAdded);
  }, [tourOrders, selectedPinbOrders, selectedTour]);

  // Fetch eligible warehouse drivers
  useEffect(() => {
    fetchEligibleDrivers(formData.tourDate);
  }, [selectedTour?.warehouse_id, formData.tourDate]);

  // Fetch Selected Tour details
  useEffect(() => {
    if (!selectedTour) return;

    // get warehouse details
    const fetchData = async () => {
      try {
        const warehouseRes: WarehouseDetails =
          await adminApiService.getWarehouse(selectedTour.warehouse_id);
        setWarehouse(warehouseRes);

        const orderIds = selectedTour.orderIds;
        const orders: Order[] =
          await adminApiService.fetchOrdersWithItems(orderIds);
        console.log("selectedTour Order Details: ", orders);

        // const orders = getOrders();

        setTourOrders(orders);
        setShouldUpdateTourRoute(false);
        setLoading(false);
      } catch (error) {
        throw Error("error fetching tour detaiuls");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    setSelectedPinbOrders([]);
    setFormData(initialFormState);
  }, [selectedTour]);

  // Set OrderRef
  useEffect(() => {
    if (!selectedOrderId || !orderRef.current) return;
    orderRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedOrderId]);

  const handleOrderSelect = (orderId: number) => {
    // console.log("handle Order Select:", orderId);
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleOrderRemove = (
    type: "torders" | "porders",
    orderId: number | string
  ) => {
    if (orderId == null) return;

    if (type === "torders") {
      setTourOrders((prev) =>
        prev.filter((order) => order.order_id !== orderId)
      );
    } else if (type === "porders") {
      setSelectedPinbOrders((prev) =>
        prev.filter((order) => order.order_id !== orderId)
      );
    }

    if (selectedOrderId === orderId) setSelectedOrderId(null);
    setRemoveOrderId(null);
  };
  const orderToDelete = tourOrders.find((o) => o.order_id === removeOrderId);

  // const handleSelectPinbOrder = async (e: any) => {
  //   console.log("Hit!!");
  //   const value = e.target.value;

  //   console.log("handleSelectPinbOrder orders: ", value);

  //   const orderIds = Array.isArray(value) ? value.join(",") : value;

  //   const orders: Order[] =
  //     await adminApiService.fetchOrdersWithItems(orderIds);
  //   setSelectedPinbOrders(orders);
  // };

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
      search_order.order_id.toString()
    );
    setSelectedPinbOrders(orders);
  };

  // Tour modification functions
  const handleFormChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
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
        tour_route: [],
        orderIds: [torders, porders].filter(Boolean).join(","),
        updated_by: getCurrentUser().email,
        // approved_by: getCurrentUser().user_id,
        // approved_at: new Date().toISOString(),
      };
      console.log("Update D-Tour Request: ", request);
      const res: DynamicTourRes =
        await adminApiService.requestDynamicTour(request);
      console.log("Update D-Tour Response: ", res);

      notifyUnassignedOrders(res.unassigned as UnassignedRes[]);

      const unassignedOrderIds = new Set(res.unassigned.map((u) => u.orderId));

      // console.log("unassigned order ids: ", unassignedOrderIds);
      setTourOrders((prev) =>
        prev.filter((o) => !unassignedOrderIds.has(o.order_id))
      );

      setSelectedTour(res.dynamicTour);
      // selectedTourOrders will be populated in UseEffect above
      setSelectedPinbOrders([]);
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
      const request: rejectDynamicTour_Req = {
        tour_id: selectedTour?.id!,
        userId: getCurrentUser().email,
        reason,
      };

      const res = await adminApiService.rejectDynamicTour(request);
      console.log("Reject D-Tour Response:", res);

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

  const generateTimeOptions = () =>
    Array.from({ length: (24 - 7) * 2 }, (_, i) => {
      const hour = 7 + Math.floor(i / 2);
      const minutes = i % 2 === 0 ? "00" : "30";
      return `${String(hour).padStart(2, "0")}:${minutes}`;
    });

  return {
    showRejectModal,
    setShowRejectModal,
    loading,
    warehouse,
    drivers,
    tourOrders,
    shouldUpdateTourRoute,

    selectedPinbOrders,
    handleSelectPinbOrder,

    removeOrderId,
    setRemoveOrderId,
    orderToDelete,
    handleOrderRemove,

    handleOrderSelect,
    generateTimeOptions,

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
