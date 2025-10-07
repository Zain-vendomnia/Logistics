import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-polylinedecorator";

interface Props {
  positions: [number, number][];
  color: string;
}

const PolylineDecoratorWrapper: React.FC<Props> = ({ positions, color }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;

    const polyline = L.polyline(positions);
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: "5%",
          repeat: "10%",
          symbol: L.Symbol.arrowHead({
            pixelSize: 8,
            polygon: false,
            pathOptions: { stroke: true, color: "black" },
          }),
        },
      ],
    });

    decorator.addTo(map);

    return () => {
      map.removeLayer(decorator);
      polyline.remove();
    };
  }, [map, positions, color]);

  return null;
};

export default PolylineDecoratorWrapper;
