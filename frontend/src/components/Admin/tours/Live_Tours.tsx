import { useEffect, useState, useCallback } from "react";
import "../css/Admin_TourTemplate.css";
import { TourRow, TourStatus } from "../../../types/tour.type";
import adminApiService from "../../../services/adminApiService";
import SpecTable from "../SpecTable";

const LiveTours = () => {
  const [tours, setTours] = useState<TourRow[]>([]);

  const loadTours = useCallback(async () => {
    try {
      // debugger;
      const res = await adminApiService.fetchToursByStatus(TourStatus.live);
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

  return (
    <SpecTable
      title={"Live Tours"}
      tours={tours}
      detailsUrl="/live/tour/detail/"
      onLoadTours={() => loadTours()}
      onNodeClick={() => {}}
      // extraActions={extraActions}
    />
  );
};

export default LiveTours;
