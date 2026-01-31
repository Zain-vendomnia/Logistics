import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Order } from "../../types/order.type";
import { useFetchTourDetails } from "./useFetchTourDetails";
import { tourService } from "../../services/tour.service";

export const useCompletedTourDetails = () => {
  const { id: tourId } = useParams<{ id: string }>();
  const { xTour, isTourLoading } = useFetchTourDetails(Number(tourId));

  const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const [showPodModal, setShowPodModal] = useState(false);
  const [orderPod, setOrderPod] = useState<Order | null>(null);

  useEffect(() => {
    if (!xTour) return;

    setTourOrders(xTour.orders || []);
  }, [xTour]);

  const handlePreparePOD = (orderId: number) => {
    // console.log("Order Id Selected POD:", orderId);
    // debugger;

    const order = tourOrders.find((x) => x.order_id === orderId);

    if (!order) return;

    setOrderPod(order);

    setShowPodModal(true);
  };

  const handleDownloadPOD = () => {
    if (!orderPod) return;
    tourService.downloadPOD(orderPod);
  };

  return {
    xTour,
    orderPod,
    tourOrders,
    isTourLoading,
    showPodModal,
    setShowPodModal,
    handlePreparePOD,
    handleDownloadPOD,
  };
};
