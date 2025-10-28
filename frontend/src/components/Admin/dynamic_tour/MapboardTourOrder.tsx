import { Box, Divider, Stack, Tooltip, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InfoIcon from "@mui/icons-material/Info";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

import { Order } from "../../../types/order.type";
import { Stop } from "../../../types/tour.type";

const defaultIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function pinTitle(title: string) {
  return (
    <Typography
      fontWeight={"bold"}
      variant="subtitle1"
      sx={{
        m: 0,
        mb: 0.5,
        p: 0,
        lineHeight: 1.2,
        display: "block",
        color: "primary.main",
      }}
      gutterBottom={false}
    >
      {title}
    </Typography>
  );
}

interface Props {
  orderItem: Order;
  stop?: Stop;
  stopNumber?: number;
  color?: string;
}
const MapboardTourOrder = ({
  orderItem: order,
  stop,
  stopNumber,
  color = "red",
}: Props) => {
  const weightNItems = () => (
    <Box sx={{ mt: 0.5 }}>
      <Divider sx={{ my: 0.75 }} />

      {/* <Divider sx={{ my: 0.75 }} /> */}
      <Stack spacing={0.25}>
        {order.items.map((item, idx) => (
          <Stack key={idx} direction="row" alignItems="center" spacing={0.75}>
            <Typography variant="subtitle2">
              {item.article} × {item.quantity}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction={"row"} spacing={0.75} mt={0.5}>
        <Typography variant="subtitle2">
          <strong>Weight:</strong> {order.weight_kg} kg
        </Typography>
        <Typography variant="subtitle2">
          <strong>Panels:</strong>{" "}
          {order.items.reduce((acc, itm) => acc + itm.quantity, 0)}
        </Typography>
      </Stack>
    </Box>
  );

  const numberedIcon = L.divIcon({
    className: "",
    html: `
        <div style="
        background-color: ${color};
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        line-height: 28px;
        text-align: center;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 0 2px rgba(0,0,0,0.4);
        z-index:50;
        ">
        ${stopNumber ?? 0}
        </div>
        `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });

  //   if (order.order_id === 11 || order.order_id === 14) {
  //     console.log(`[Mapboard] Order ${order.order_id} rendered`);
  //   }
//   console.log(`[Test Order Obj]`, order);
  if (!order) return null;
  return (
    <Marker
      key={order.order_id}
      position={order.location!}
      //   position={[order.location.lat, order.location.lng]}
      icon={stop ? numberedIcon : defaultIcon}
    >
      <Popup>
        {pinTitle(order.order_number)}
        <Stack direction="row" spacing={0.5}>
          <Tooltip
            title={
              <Box sx={{ p: 0.25 }}>
                <Typography variant="caption">
                  {order.street + `,` + order.city}
                </Typography>
              </Box>
            }
            arrow
            placement="top-end"
          >
            <LocationOnIcon
              fontSize="small"
              sx={{
                color: "text.secondary",
                cursor: "pointer",
                transition: "color 0.2s ease",
                "&:hover": {
                  color: "primary.main",
                },
              }}
            />
          </Tooltip>
          <Typography variant="subtitle2">
            <strong>{order.warehouse_town}</strong>
          </Typography>
        </Stack>
        {order.items?.length > 0 && weightNItems()}
        <Divider sx={{ mt: 0.5, mb: 0.75 }} />
        <Stack spacing={0}>
          {stop ? (
            <>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">
                  <strong>Arrival:</strong>{" "}
                  {new Date(stop.time.arrival).toLocaleDateString()}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <LocalShippingIcon fontSize="small" color="action" />

                <Typography variant="subtitle2">
                  <strong>Departure:</strong>{" "}
                  {new Date(stop.time.departure).toLocaleDateString()}
                </Typography>
              </Stack>
            </>
          ) : (
            <>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <AccessTimeIcon fontSize="small" color="action" />
                <Typography variant="subtitle2">
                  <strong>Placed:</strong>{" "}
                  {new Date(order.order_time).toLocaleDateString()}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <LocalShippingIcon fontSize="small" color="action" />

                <Typography variant="subtitle2">
                  <strong>Deliver by:</strong>{" "}
                  {new Date(order.expected_delivery_time).toLocaleDateString()}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>
      </Popup>
    </Marker>
  );
};

export default MapboardTourOrder;
