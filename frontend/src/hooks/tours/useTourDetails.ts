import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Order } from "../../types/order.type";
import {
  rejectTour_Req,
  Tourinfo,
  UpdateTour_Req,
} from "../../types/tour.type";
import { Driver, Warehouse } from "../../types/warehouse.type";
import { tourService } from "../../services/tour.service";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { SelectChangeEvent } from "@mui/material";
import theme from "../../theme";
import { getAvailableDrivers } from "../../services/driverService";
import { getCurrentUser } from "../../services/auth.service";

export const useTourDetails = (xTour: Tourinfo | null) => {
  const fontsize = "1rem";
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [tourOrders, setTourOrders] = useState<Order[]>([]);

  const [ordersToRemove, setOrdersToRemove] = useState<Order[]>([]);

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const loadTourDetails = useCallback(async (tour: Tourinfo) => {
    setIsLoading(true);
    try {
      setTourOrders(tour.orders || []);

      const warehouseRes: Warehouse = await tourService.getWarehouseDetails(
        tour.warehouse_id,
      );
      setWarehouse(warehouseRes);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const orderIdxLookup = useMemo(() => {
    // if (!xTour.orders || xTour.orders.length <= 0) return;

    return new Map<number, number>(
      tourOrders.map((order, idx) => [order.order_id, idx]),
    );
  }, [xTour?.orders]);

  useEffect(() => {
    if (!xTour) return;
    loadTourDetails(xTour);
  }, [xTour]);

  const [shouldUpdateTourRoute, setShouldUpdateTourRoute] =
    useState<boolean>(false);
  const [shouldUpdateTourData, setShouldUpdateTourData] =
    useState<boolean>(false);

  const [orderExpanded, setOrderExpanded] = useState(false);

  function handleTourOrderRemove(orderItem: Order) {
    setTourOrders((prev) => {
      setOrdersToRemove((removed) => [orderItem, ...removed]);
      return prev.filter((o) => o.order_id !== orderItem.order_id);
    });
  }
  const restoreRemovedOrder = (reqOrder?: Order, all: boolean = false) => {
    if (all) {
      setTourOrders((prev) => {
        const restored = [...prev];
        ordersToRemove.forEach((order) => {
          const oIdx = orderIdxLookup.get(order.order_id);
          oIdx && restored.splice(oIdx, 0, order);
        });

        return restored;
      });

      setOrdersToRemove([]);
      setShouldUpdateTourRoute(false);
      return;
    }

    if (!reqOrder) return;

    const removed = ordersToRemove.find(
      (o) => o.order_id === reqOrder.order_id,
    );
    if (!removed) return;

    // const removed_oIdx = orderIdxLookup.get(reqOrder.order_id);
    // if (removed_oIdx === undefined) return;

    setTourOrders((prev) => {
      if (prev.some((o) => o.order_id === removed.order_id)) {
        return prev;
      }
      const next = [...prev];
      next.splice(0, 0, removed);
      return next;
    });

    setOrdersToRemove((prev) =>
      prev.filter((o) => o.order_id !== reqOrder.order_id),
    );

    // const exist_selectedOrderIds = xTour?.orderIds
    //   .split(",")
    //   .map(Number)
    //   .includes(reqOrder.order_id);
    // if (exist_selectedOrderIds) {
    //   setTourOrders((prev) => [...prev, reqOrder]);
    //   return;
    // }
  };

  const { showNotification } = useNotificationStore();

  const [expandDetailsPanel, setExpandDetailsPanel] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showWarehouseDetails, setShowWarehouseDetails] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const initialFormState = {
    // driverId: "",
    driverId: "",
    tourDate: today,
    startTime: "07:30",
    routeColor: theme.palette.primary.light,
  };

  const [formData, setFormData] = useState(initialFormState);
  const formDataRef = useRef(formData);

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
    setShouldUpdateTourData(true);
  };

  const handleUpdateTour = async () => {
    // console.log("Latest formData Ref:", formDataRef.current);
    // console.log("Latest formData:", formData);

    const form = formDataRef.current;

    if (!xTour) return;
    setIsLoading(true);
    try {
      const removedOrderIds = new Set(ordersToRemove.map((ro) => ro.order_id));
      let xOrdersIds = tourOrders
        .filter((to) => !removedOrderIds.has(to.order_id))
        .map((o) => o.order_id);

      xOrdersIds = [
        ...xOrdersIds,
        // ...selectedPinbOrders.map((po) => po.order_id),
      ];
      // selectedPinbOrders &&
      //   xOrdersIds.push([...selectedPinbOrders.map((po) => po.order_id)]);

      const request: UpdateTour_Req = {
        id: xTour.id,
        tourName: xTour.tour_name,
        tourDate: form.tourDate,
        startTime: form.startTime,
        routeColor: form.routeColor,
        orderIds: xOrdersIds,
        driverId: Number(form.driverId),
        vehicleId: xTour.vehicle_id,
        warehouseId: warehouse?.id!, // ensure from warehouse service
        userId: getCurrentUser().email, // service helper
        comments: "",
      };
      const updatedTour = await tourService.updateTour(request);
      showNotification({
        message: `Tour ${updatedTour.tour_name} updated successfully`,
        severity: NotificationSeverity.Success,
        duration: 8000,
      });
    } catch (error: unknown) {
      console.error("Error updating tour:", error);
      showNotification({
        message: "Error accepting tour",
        severity: NotificationSeverity.Error,
        duration: 8000,
      });
    } finally {
      setOrdersToRemove([]);
      // setSelectedPinbOrders([]);
      setIsLoading(false);
      setShouldUpdateTourRoute(false);
      setShouldUpdateTourData(false);
    }
  };

  const handleRouteOptimize = () => {
    if (!shouldUpdateTourRoute) return;

    showNotification({ message: "Processing Route Optimization..." });
    handleUpdateTour();
  };

  const fetchEligibleDrivers = async (date: string) => {
    if (!xTour) return;

    try {
      const res = await getAvailableDrivers(date, xTour.warehouse_id ?? 0);
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

  const handleTourReject = async (reason: string) => {
    setIsLoading(true);
    try {
      const request: rejectTour_Req = {
        tour_id: xTour?.id!,
        userId: getCurrentUser().email,
        reason,
      };

      // await tourService.rejectTourInstance(request);

      showNotification({
        message: `Tour ${xTour?.tour_name} Rejected Successfully`,
        severity: NotificationSeverity.Success,
      });
    } catch (error: unknown) {
      console.error("Error Rejecting Tour:", error);
      showNotification({
        message: "Error Rejecting Tour",
        severity: NotificationSeverity.Error,
      });
    } finally {
      // setXTour(null);
      // setSelectedPinbOrders([]);
      setOrdersToRemove([]);
      setIsLoading(false);
      navigate("/scheduled/tour");
    }
  };

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    if (!xTour) return;

    fetchEligibleDrivers(xTour.tour_date);
    setFormData({
      driverId: xTour.driver_id?.toString() ?? "",
      tourDate: xTour.tour_date ? xTour.tour_date.split("T")[0] : today,
      startTime: xTour.start_time
        ? xTour.start_time.slice(0, 5) // "07:00"
        : "07:30",
      routeColor: xTour.warehouse_colorCode ?? theme.palette.primary.light,
    });
  }, [xTour?.warehouse_id]);

  // To udpate driver list on selected date
  useEffect(() => {
    if (!xTour) return;
    fetchEligibleDrivers(xTour.tour_date);
  }, [formData.tourDate]);

  // const tourAction = useMemo(() => {
  //   const orderIdsArray =
  //     typeof xTour?.orderIds === "string"
  //       ? xTour.orderIds.split(",").map(Number).length
  //       : 0;

  //   if (
  //     orderIdsArray !== tourOrders.length ||
  //     selectedPinbOrders.length > 0 ||
  //     shouldUpdateTourData === true
  //   ) {
  //     setShouldUpdateTourRoute(true);
  //     return { title: "Update Tour", onClick: handleUpdateTour };
  //   } else {
  //     setShouldUpdateTourRoute(false);
  //   }
  //   // return {
  //   //   title: "",
  //   //   onClick: () => {},
  //   // };
  // }, [
  //   xTour?.orderIds,
  //   tourOrders.length,
  //   selectedPinbOrders.length,
  //   shouldUpdateTourData,
  // ]);

  // const showUpdateTourButton = shouldUpdateTourRoute || shouldUpdateTourData;

  return {
    fontsize,
    navigate,

    isLoading,
    tourOrders,
    warehouse,
    drivers,

    ordersToRemove,

    shouldUpdateTourRoute,
    setShouldUpdateTourRoute,
    shouldUpdateTourData,
    setShouldUpdateTourData,

    orderExpanded,
    setOrderExpanded,

    expandDetailsPanel,
    setExpandDetailsPanel,

    showRejectModal,
    setShowRejectModal,

    showWarehouseDetails,
    setShowWarehouseDetails,

    handleTourOrderRemove,
    restoreRemovedOrder,

    today,
    formData,
    handleFormChange,
    handleTourReject,
    handleUpdateTour,
    handleRouteOptimize,
    // tourAction,
    // showUpdateTourButton,
  };
};
