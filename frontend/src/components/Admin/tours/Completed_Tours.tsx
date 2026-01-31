import { useEffect, useState, useCallback } from "react";
import "../css/Admin_TourTemplate.css";
import adminApiService from "../../../services/adminApiService";
import { TourRow, TourStatus } from "../../../types/tour.type";
import SpecTable, { RowAction } from "../SpecTable";
import { generatePOD } from "../../../utils/tourHelper";
import { useNavigate } from "react-router-dom";

const CompletedTours = () => {
  const navigate = useNavigate();
  const [tours, setTours] = useState<TourRow[]>([]);

  const loadTours = useCallback(async () => {
    try {
      const tourRows = await adminApiService.fetchToursByStatus(
        TourStatus.completed,
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

  const handleTourClick = (tour: TourRow) => {
    navigate(`/completed/tour/detail/${tour.id}`);
  };

  return (
    <>
      <SpecTable
        title={"Completed Tours"}
        tours={tours}
        detailsUrl="/completed/tour/detail/"
        onLoadTours={() => loadTours()}
        onNodeClick={handleTourClick}
        rowActions={rowActions}
      />
    </>
  );
};

export default CompletedTours;
