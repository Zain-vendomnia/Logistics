import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-polylinedecorator';
import { useParams } from 'react-router-dom';
import adminApiService from '../../services/adminApiService';
import latestOrderServices from './AdminServices/latestOrderServices';
import TourSidebar from './TourSidebar';
import './css/Admin_TourMapView.css';

type Stop = {
  id: string;
  location_id: string;
  lat: number;
  lon: number;
  arrival: string;
  type: string;
};

const TourMapPage: React.FC = () => {
  const { tour_id } = useParams<{ tour_id: string }>();
  const parsedTourId = tour_id ? parseInt(tour_id, 10) : null;
  const [routePoints, setRoutePoints] = useState<[number, number][][]>([]);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<any | null>(null);
  const [routeDistance, setRouteDistance] = useState<number>(0);
  const [routeTime, setRouteTime] = useState<number>(0);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    const fetchData = async () => {
      const instance = latestOrderServices.getInstance();
      const toursdata = await instance.getTours();
      const tour = toursdata.find((tour: any) => tour.id === Number(tour_id));
      setSelectedTour(tour);
    };

    fetchData();
  }, [tour_id]);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        if (parsedTourId !== null) {
          const response = await adminApiService.getRouteResponse(parsedTourId);
          const data = response.data;

          if (data?.solution?.routes.length > 0) {
            const route = data.solution.routes[0];
            setRouteDistance(parseFloat((data.solution.distance / 1000).toFixed(2)));
            setRouteTime(data.solution.time);

            const formattedRoutes = route.points.map((routePoint: { coordinates: [number, number][] }) =>
              routePoint.coordinates.map(([lon, lat]) => [lat, lon])
            );
            setRoutePoints(formattedRoutes);

            const mappedStops: Stop[] = route.activities.map((activity: any, index: number) => ({
              id: `${index + 1}`,
              location_id: activity.location_id,
              lat: activity.address.lat,
              lon: activity.address.lon,
              arrival: activity.arr_date_time,
              type: activity.type,
            }));

            setStops(mappedStops);
          }

          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching route data:", error);
        setLoading(false);
      }
    };

    fetchRouteData();
  }, [parsedTourId]);

  const createIcon = useMemo(() => {
    return (label: string, bgColor: string) =>
      L.divIcon({
        html: `<div style="
          background-color: ${bgColor};
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
        ">${label}</div>`,
        className: 'custom-icon',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
  }, []);

  const zoomToStop = (lat: number, lon: number) => {
    const map = mapRef.current;
    if (map) {
      map.flyTo([lat, lon], 15, { duration: 0.5 });
    }
  };

  const PolylineDecoratorComponent = React.memo(({ positions }: { positions: [number, number][] }) => {
    const map = useMap();

    useEffect(() => {
      if (!selectedTour) return;

      const color = selectedTour.tour_route_color;

      const polyline = L.polyline(positions, {
        color,
        weight: 5,
        opacity: 0.7,
      }).addTo(map);

      const arrowHead = L.Symbol.arrowHead({
        pixelSize: 10,
        pathOptions: { stroke: true, color },
      });

      const decorator = (L as any).polylineDecorator(polyline, {
        patterns: [{ offset: '20%', repeat: '100px', symbol: arrowHead }],
      }).addTo(map);

      return () => {
        map.removeLayer(polyline);
        map.removeLayer(decorator);
      };
    }, [map, positions]); // ✅ 'selectedTour' removed from dependencies

    return null;
  });

  if (loading || !selectedTour) return <div>Loading route data...</div>;

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <TourSidebar
        selectedTour={selectedTour}
        stops={stops}
        routeDistance={routeDistance}
        routeTime={routeTime}
        onStopClick={zoomToStop}
      />

      <div style={{ flex: 1 }}>
        <MapContainer
          center={[stops[0]?.lat || 51.191566, stops[0]?.lon || 10.00519]}
          zoom={13}
          maxZoom={19}
          ref={mapRef}
          style={{ height: '100vh', width: '100%' }}
        >
          <TileLayer
            url="https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiemFpbi12ZW5kb21uaWEiLCJhIjoiY208ZmlramFxMGNzazJscHRjNGs5em80NyJ9.1nIfy1EdSPl2cYvwvxOEmA"
            attribution='&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; OpenStreetMap contributors'
            detectRetina={true}
            tileSize={512}
            zoomOffset={-1}
          />

          {routePoints.map((route, index) => (
            <PolylineDecoratorComponent key={index} positions={route} />
          ))}

          {stops.map((stop, index) => (
            <Marker
              key={index}
              position={[stop.lat, stop.lon]}
              icon={
                stop.type === 'start'
                  ? createIcon('S', selectedTour.tour_route_color)
                  : stop.type === 'end'
                  ? createIcon('E', selectedTour.tour_route_color)
                  : createIcon(String(index), selectedTour.tour_route_color)
              }
            >
              <Popup>
                <div>{stop.location_id} - {stop.type}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default TourMapPage;
