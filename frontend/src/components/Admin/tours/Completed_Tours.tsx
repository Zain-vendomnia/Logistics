import { useEffect, useState, useCallback } from "react";
import "../css/Admin_TourTemplate.css";
import adminApiService from "../../../services/adminApiService";
import { TourRow, TourStatus } from "../../../types/tour.type";
import SpecTable, { RowAction } from "../SpecTable";
import { generatePOD } from "../../../utils/tourHelper";

const CompletedTours = () => {
  const [tours, setTours] = useState<TourRow[]>([]);

  const loadTours = useCallback(async () => {
    try {
      const res = await adminApiService.fetchToursByStatus(
        TourStatus.completed
      );
      const asd = res.data as TourRow[];
      setTours(
        asd.map(
          (t): TourRow => ({
            id: t.id,
            tour_name: t.tour_name,
            status: t.status,
            tour_date: t.tour_date,
            route_color: t.route_color,
            comments: t.comments,
            driver_name: t.driver_name || "N/A",
            warehouse_id: t.warehouse_id,
            driver_id: t.driver_id || 0,
            vehicle_id: t.vehicle_id,
            orderIds: t.orderIds,
          })
        )
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {}, 3000);
    loadTours();
    return () => clearInterval(intervalId);
  }, [loadTours]);

  const requestPOD = async (req: TourRow) => {
    try {
      generatePOD(req.id.toString(), req.id, req.driver_id);
    } catch (error) {
      console.error("Failed to request POD:", error);
    }
  };

  const rowActions: RowAction[] = [
    {
      key: "gn-pod",
      label: "Request POD",
      onClick: (tour: TourRow) => requestPOD(tour),
    },
  ];
  return (
    <>
      <SpecTable
        title={"Completed Tours"}
        tours={tours}
        detailsUrl="/completed/tour/detail/"
        onLoadTours={() => loadTours()}
        onNodeClick={() => {}}
        rowActions={rowActions}
      />
    </>
  );
};

export default CompletedTours;
