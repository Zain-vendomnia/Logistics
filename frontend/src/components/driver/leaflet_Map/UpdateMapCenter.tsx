import { useEffect } from "react";
import { useMap } from "react-leaflet";

const UpdateMapCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  console.log("map center:", map.getCenter());

  useEffect(() => {
    map.setView(center, map.getZoom(), {
      animate: true,
      duration: 1.5, // Smooth transition over 1.5 seconds
      easeLinearity: 0.5, // Moderate animation easing
    });
  }, [center, map]);
  return null;
};

export default UpdateMapCenter;
