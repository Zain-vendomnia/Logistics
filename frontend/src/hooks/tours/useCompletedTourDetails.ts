import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Order } from "../../types/order.type";
import { useFetchTourDetails } from "./useFetchTourDetails";
import { tourService } from "../../services/tour.service";
import adminApiService from "../../services/adminApiService";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";

export const useCompletedTourDetails = () => {
  const { id: tourId } = useParams<{ id: string }>();
  const { xTour, isTourLoading } = useFetchTourDetails(Number(tourId));
  const [loadingPod, setLoadingPod] = useState(false);

  const { showNotification } = useNotificationStore();

  const [tourOrders, setTourOrders] = useState<Order[]>([]);
  const [showPodModal, setShowPodModal] = useState(false);
  const [podOrder, setPodOrder] = useState<Order | null>(null);
  const [podBlob, setPodBlob] = useState<Blob | null>(null);
  const [podUrl, setPodUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!xTour) return;

    setTourOrders(xTour.orders || []);
  }, [xTour]);

  const handlePreparePOD = async (orderId: number) => {
    if (!orderId) return;

    setLoadingPod(true);
    try {
      const order = tourOrders.find((x) => x.order_id === orderId);
      if (!order) return;

      const pdfBlob = await adminApiService.requestPod(
        Number(tourId!),
        orderId,
      );
      const url = URL.createObjectURL(pdfBlob);

      setPodUrl(url);
      setPodBlob(pdfBlob);
      setPodOrder(order);
      setShowPodModal(true);
    } catch (error) {
      showNotification({
        message: `error in loading POD`,
        severity: NotificationSeverity.Warning,
      });
    } finally {
      setLoadingPod(false);
    }
  };

  const handleDownloadPOD = () => {
    if (!podOrder || !podUrl) return;

    const a = document.createElement("a");
    a.href = podUrl;
    // a.download = "POD.pdf";
    a.download = `POD-Order-${podOrder.order_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const closePodModal = () => {
    setShowPodModal(false);
    if (podUrl) {
      URL.revokeObjectURL(podUrl);
      setPodUrl(null);
    }
  };

  return {
    xTour,
    podUrl,
    podBlob,
    podOrder,
    loadingPod,
    tourOrders,
    isTourLoading,
    showPodModal,
    setShowPodModal,
    handlePreparePOD,
    handleDownloadPOD,
    closePodModal,
  };
};
