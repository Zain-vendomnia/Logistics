import React, { useEffect, useRef } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";

import { Order } from "../../../types/dto.type";
import { getDaysLeft } from "../../../utils/formatConverter";

interface Props {
  order: Order;
}

const DynamicTourOrderDetails = ({ order }: Props) => {
  const fontsize = "0.95rem";

  const orderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!orderRef.current) return;
    orderRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const deliveryDate = new Date(order.expected_delivery_time);

  const placedAt = new Date(order.order_time).toLocaleDateString();
  const deliveryAt = deliveryDate.toLocaleDateString();
  const daysLeft = getDaysLeft(deliveryDate, new Date());

  const ItemRows = order.items.map((item) => ({
    article: item.article,
    quantity: item.quantity,
  }));

  console.log("Order Details Comp: ", order);
  return (
    <Box
      ref={orderRef}
      display="flex"
      alignItems="flex-start"
      justifyContent="flex-start"
      width="100%"
      border="1px solid"
      borderRadius={2}
      mt={1}
      mb={2}
      p={1}
    >
      <Stack spacing={1}>
        <Box>
          <Typography variant="body2" fontSize={fontsize}>
            Placed: {placedAt}
          </Typography>
          <Typography variant="body2" fontSize={fontsize}>
            Delivery by: {deliveryAt}
          </Typography>
          <Typography
            variant="subtitle2"
            fontSize={"0.75rem"}
            fontStyle={"italic"}
            sx={{
              color: daysLeft.includes("Overdue")
                ? "error.main"
                : "primary.main",
            }}
          >
            ({daysLeft})
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={"bold"}>
            Location
          </Typography>
          <Typography variant="body2" fontSize={fontsize}>
            {order.city}, {order.street}
          </Typography>
          <Typography variant="body2" fontSize={fontsize}>
            zip:{order.zipcode}
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={"bold"}>
            Items
          </Typography>
          <Table
            sx={{ minWidth: "40%" }}
            size="small"
            aria-label="a dense table"
          >
            <TableRow>
              <TableCell sx={{ fontSize: fontsize }}>Article</TableCell>
              <TableCell sx={{ fontSize: fontsize }}>Quantity</TableCell>
            </TableRow>
            <TableBody>
              {ItemRows.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell align="left" sx={{ fontSize: fontsize }}>
                    {row.article}
                  </TableCell>
                  <TableCell align="center" sx={{ fontSize: fontsize }}>
                    {row.quantity}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Stack>
    </Box>
  );
};

export default DynamicTourOrderDetails;
