import React, { useEffect, useState } from "react";
import {
  ListItem,
  ListItemButton,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Order, OrderStatus } from "../../../types/order.type";
import DynamicTourOrderDetails from "./DynamicTourOrderDetails";
import theme from "../../../theme";
import { tourService } from "../../../services/tour.service";

type Props = {
  items: Order[];
  handleDelete: (order: Order) => void;
  onSelect?: (id: number) => void;
};

export const DynamicOrdersList = ({ items, handleDelete, onSelect }: Props) => {
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderList, setOrderList] = useState<Order[]>(items);

  useEffect(() => {
    setOrderList(items);
  }, [items]);

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const handleSelectItem = (orderId: number) => {
    onSelect && onSelect(orderId);
  };

  return (
    <Box width={"100%"}>
      {orderList.map((item, idx) => (
        <React.Fragment key={idx}>
          <ListItem disablePadding>
            <ListItemButton
              sx={{ px: 0, m: 0 }}
              //   onClick={() => handleOrderSelect(item)}
              onClick={() => handleOrderSelect(item.order_id)}
            >
              <Typography fontSize="medium">
                <Box component="span" color="primary.dark">
                  {String(idx + 1).padStart(2, "0")}
                </Box>{" "}
                {item.order_number}
              </Typography>
            </ListItemButton>

            {item.status === OrderStatus.delivered ? (
              <IconButton onClick={() => handleSelectItem(item.order_id)}>
                <DownloadIcon sx={{ color: theme.palette.primary.dark }} />
              </IconButton>
            ) : (
              <IconButton onClick={() => handleDelete(item)}>
                <DeleteOutlineIcon />
              </IconButton>
            )}
          </ListItem>
          {selectedOrderId === item.order_id && (
            <DynamicTourOrderDetails order={item} />
          )}
        </React.Fragment>
      ))}
    </Box>
  );
};
