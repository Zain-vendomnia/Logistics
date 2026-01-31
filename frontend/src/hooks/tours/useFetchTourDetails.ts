import { useCallback, useEffect, useState } from "react";
import { Tourinfo } from "../../types/tour.type";
import { tourService } from "../../services/tour.service";

export const useFetchTourDetails = (tourId: number) => {
  const [isTourLoading, setIsTourLoading] = useState<boolean>(false);
  const [xTour, setXTour] = useState<Tourinfo | null>(null);

  const loadTour = useCallback(async (tourId: number) => {
    setIsTourLoading(true);
    try {
      const tour: Tourinfo = await tourService.getTourDetails(tourId);
      setXTour(tour);
    } finally {
      setIsTourLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!tourId) return;
    loadTour(tourId);
  }, [tourId]);

  return {
    xTour,
    isTourLoading,
    reloadTour: loadTour,
  };
};
