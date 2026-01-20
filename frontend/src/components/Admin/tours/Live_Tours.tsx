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
      const tourRows = await adminApiService.fetchToursByStatus(
        TourStatus.live,
      );
      setTours(tourRows);
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
