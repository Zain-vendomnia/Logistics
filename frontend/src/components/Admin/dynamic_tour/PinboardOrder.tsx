import { Box, Divider, Stack, Tooltip, Typography } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InfoIcon from "@mui/icons-material/Info";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

import { Order } from "../../../types/order.type";

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

export function pinTitle(title: string) {
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
}
const PinboardOrder = ({ orderItem: order }: Props) => {
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
  return (
    <Marker key={order.order_id} position={order.location} icon={defaultIcon}>
      <Popup>
        {pinTitle(order.order_number)}
        <Stack direction="row" spacing={0.5}>
          {/* <LocationOnIcon fontSize="small" color="action" /> */}
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
            // placement="left-start"
          >
            <LocationOnIcon
              fontSize="small"
              sx={{
                // fontSize: "small",
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
        </Stack>
      </Popup>
    </Marker>
  );
};

export default PinboardOrder;
