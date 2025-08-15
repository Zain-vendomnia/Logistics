import { useEffect, useRef, useState } from "react";
import { useTheme, Theme } from "@mui/material/styles";
import { SelectChangeEvent } from "@mui/material";
import { DynamicTourPayload } from "../types/tour.type";
import adminApiService from "../services/adminApiService";
import { Driver, Order, Warehouse } from "../types/dto.type";
import { getAvailableDrivers } from "../services/driverService";
import useDynamicTourStore from "../store/useDynamicTourStore";
// import adminApiService from "../../services/adminApiService";

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

interface Props {
  selectedTour: DynamicTourPayload;
}

export const useDynamicTourService = () => {
  const selectedTour = useDynamicTourStore((state) => state.selectedTour);
  console.log("Selected Tour - Hook", selectedTour);

  const theme = useTheme<Theme>();

  const [warehouse, setWarehouse] = useState<Warehouse | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const [isOrderListUpdated, setOrderListUpdated] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchEligibleDrivers(formData.tourDate);
  }, [selectedTour?.warehouse_id, formData.tourDate]);

  useEffect(() => {
    if (!selectedTour) return;

    // get warehouse details
    const fetchData = async () => {
      const warehouseRes = await adminApiService.getWarehouse(
        selectedTour.warehouse_id
      );
      setWarehouse(warehouseRes.data);

      const orderIds = "37,38,39,40";
      const res = await adminApiService.fetchOrdersWithItems(orderIds);
      console.log(res.data);
      const orders = res.data;

      // const orders = getOrders();

      setTourOrders(orders);
      setOrderListUpdated(false);
    };
    fetchData();

    setFormData(initialFormState);
  }, [selectedTour]);

  useEffect(() => {
    if (!selectedOrderId || !orderRef.current) return;
    orderRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedOrderId]);

  const handleOrderRemove = () => {
    if (deleteTargetId == null) return;
    setTourOrders((prev) =>
      prev.filter((order) => order.order_id !== deleteTargetId)
    );
    if (selectedOrderId === deleteTargetId) setSelectedOrderId(null);
    setDeleteTargetId(null);
    setOrderListUpdated(true);
  };
  const orderToDelete = tourOrders.find((o) => o.order_id === deleteTargetId);

  const hanldeOrderAdd = () => {
    setOrderListUpdated(true);
  };

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

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
    // await adminApiService.submitTourDetails(formData);
  };

  const generateTimeOptions = () =>
    Array.from({ length: (24 - 7) * 2 }, (_, i) => {
      const hour = 7 + Math.floor(i / 2);
      const minutes = i % 2 === 0 ? "00" : "30";
      return `${String(hour).padStart(2, "0")}:${minutes}`;
    });

  const handleTourReject = () => {};

  const newDynamicTour = () => {};

  const getDaysLeft = (endDate: Date, startDate: Date) => {
    const diffInTime = endDate.getTime() - startDate.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 60 * 60 * 24));

    const daysLeft =
      diffInDays > 0
        ? `${diffInDays} day${diffInDays !== 1 ? "s" : ""} left`
        : `Overdue by ${Math.abs(diffInDays)} day${Math.abs(diffInDays) !== 1 ? "s" : ""}`;

    return daysLeft;
  };

  return {
    warehouse,
    drivers,
    tourOrders,
    isOrderListUpdated,
    selectedOrderId,
    deleteTargetId,
    setDeleteTargetId,
    orderRef,

    orderToDelete,
    handleOrderRemove,
    hanldeOrderAdd,
    handleOrderSelect,
    generateTimeOptions,

    formData,
    today,
    theme,

    handleFormChange,
    handleTourSubmit,
    handleTourReject,
    newDynamicTour,

    getDaysLeft,
  };
};
