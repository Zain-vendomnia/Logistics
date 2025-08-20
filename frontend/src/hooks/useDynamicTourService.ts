import { useEffect, useRef, useState } from "react";
import { useTheme, Theme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material";
import {
  DynamicTourPayload,
  DynamicTourRes,
  UnassignedRes,
} from "../types/tour.type";
import adminApiService from "../services/adminApiService";
import { Driver, Order, Warehouse } from "../types/dto.type";
import { getAvailableDrivers } from "../services/driverService";
import useDynamicTourStore from "../store/useDynamicTourStore";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../store/useNotificationStore";

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
  const { selectedTour, setSelectedTour, dTourinfo_data, set_dTourinfo_data } =
    useDynamicTourStore();

  const theme = useTheme<Theme>();

  const [loading, setLoading] = useState(false);

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const [shouldUpdateTourRoute, setShouldUpdateTourRoute] = useState(false);

  const [selectedPinbOrders, setSelectedPinbOrders] = useState<Order[]>([]);

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  // const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [removeOrderId, setRemoveOrderId] = useState<number | null>(null);

  const orderRef = useRef<HTMLDivElement | null>(null);

  // Form fields states
  const today = new Date().toISOString().split("T")[0];
  const initialFormState = {
    driverId: "",
    tourDate: today,
    startTime: "07:30",
    routeColor: theme.palette.primary.main,
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
    // Or if any new pinboard orders are selected
    const tourChanged = tourOrders.some(
      (porder) => !selectedTourOrders.includes(porder.order_id)
    );

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
        const warehouseRes = await adminApiService.getWarehouse(
          selectedTour.warehouse_id
        );
        setWarehouse(warehouseRes);

        // const orderIds = "37,38,39,40";
        const orderIds = selectedTour.orderIds;
        const orders: Order[] =
          await adminApiService.fetchOrdersWithItems(orderIds);
        console.log(orders);

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

  const handleTourSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form Submit Event", e);
    console.log("Form Data Submitted:", formData);

    //************* */
    const reasons =
      "TIME_WINDOW_CONSTRAINT:cannot be assigned due to violation of time window";

    showNotification({
      title: "Order_Number",
      message: `${reasons}`,
      severity: NotificationSeverity.Warning,
      duration: 26000,
    });
    showNotification({
      // title: "Order_Number",
      message: "Order_Number",
      severity: NotificationSeverity.Warning,
      duration: 26000,
    });
  };

  const generateTimeOptions = () =>
    Array.from({ length: (24 - 7) * 2 }, (_, i) => {
      const hour = 7 + Math.floor(i / 2);
      const minutes = i % 2 === 0 ? "00" : "30";
      return `${String(hour).padStart(2, "0")}:${minutes}`;
    });

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
        // updated_by: getCurrentUser().user_id,
        // approved_by: getCurrentUser().user_id,
        // approved_at: new Date().toISOString(),
      };
      // console.log("Update D-Tour Request: ", request);
      const res: DynamicTourRes =
        await adminApiService.requestDynamicTour(request);
      // console.log("Update D-Tour Response: ", res);

      notifyUnassignedOrders(res.unassigned as UnassignedRes[]);

      // store dTourinfo_data for later use   // to be fixed later
      // const dtour_obj: DTourinfo_data = {
      //   dTour_id: selectedTour?.id!,
      //   tour: res.tour,
      //   unassigned: res.unassigned,
      // };
      // setDTourinfo(dtour_obj);

      const unassignedOrderIds = new Set(res.unassigned.map((u) => u.orderId));

      console.log("unassigned order ids: ", unassignedOrderIds);
      setTourOrders((prev) =>
        prev.filter((o) => !unassignedOrderIds.has(o.order_id))
      );

      setSelectedTour(res.dynamicTour);
      // selectedTourOrders will be populated in UseEffect above
      setSelectedPinbOrders([]);
    } catch (error) {
      throw Error("Error while creaitn new tour route");
    } finally {
      setLoading(false);
    }
  };

  const notifyUnassignedOrders = (unassigned: UnassignedRes[]) => {
    if (!unassigned.length) return;

    const OrderMap = new Map(
      tourOrders.map((o) => [o.order_id, o.order_number])
    );

    unassigned.forEach((unassign) => {
      const reasons = unassign.reasons
        .map((r: string) => r.split(":")[1])
        .join("\n");

      const order_number = OrderMap.get(unassign.orderId);

      showNotification({
        title: order_number ?? "Unknown Order",
        message: reasons || "Unassigned without reason",
        severity: NotificationSeverity.Warning,
        duration: 12000,
      });
    });
  };

  const pinboardOrderSearch = () => {};

  const handleTourReject = () => {
    console.log("Tour Rejecteion Called");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 5000);
  };

  const handleSelectPinbOrder = async (e: any) => {
    console.log("Hit!!");
    const value = e.target.value;
    const orderIds = Array.isArray(value) ? value.join(",") : value;

    const orders: Order[] =
      await adminApiService.fetchOrdersWithItems(orderIds);
    setSelectedPinbOrders(orders);
  };

  return {
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

    // pinboardOrderSearch,

    orderRef,
  };
};
