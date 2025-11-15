import {
  ListItem,
  ListItemButton,
  Typography,
  IconButton,
  Box,
  Paper,
  Divider,
  List,
  Button,
  Modal,
  // Stack,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import React, { useEffect, useState } from "react";
import { Order } from "../../../types/order.type";
import DynamicTourOrderDetails from "../dynamic_tour/DynamicTourOrderDetails";




import { motion, AnimatePresence } from "framer-motion";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { DynamicOrdersList } from "../dynamic_tour/DynamicOrdersList";

import { useDynamicTourService } from "../../../hooks/useDynamicTourService";


const modalStyle = {
  position: "absolute",
  top: "25%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3,
};


type Props = {
  orders: Order[];
  //   handleSelect: (id: number) => void;
};

export const TourOrdersList = ({ orders }: Props) => {

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [orderList, setOrderList] = useState<Order[]>();
  const [expanded, setExpanded] = useState(false);


  // ✅ Allow null for Modal state
  const [pendingRemove, setPendingRemove] = useState<Order[] | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<number[]>([]);

  // Select or deselect orders for deletion
  const SelectForDelete = (order: Order) => {

      handleSelectForDelete(order);
  };

  // Select or deselect orders for deletion
  const handleSelectForDelete = (order: Order) => {
    setPendingRemove((prev) => {
      if (!prev) return [order];

      const alreadySelected = prev.some((o) => o.order_id === order.order_id);
      return alreadySelected
        ? prev.filter((o) => o.order_id !== order.order_id)
        : [...prev, order];
    });
  };


  // ✅ Confirm delete — send to DB and update UI
  const confirmOrderRemove = async () => {
    if (!pendingRemove || pendingRemove.length === 0) return;

    const idsToDelete = pendingRemove.map((o) => o.order_id);

    // Add to pendingDeleteIds (avoid duplicates)
      setPendingDeleteIds((prev) => Array.from(new Set([...prev, ...idsToDelete])));
  };

  useEffect(() => {
    // debugger;
    console.log(`Selected Tour Orders: ${orders.length}`);
    setOrderList(orders);
  }, [orders]);

  const handleOrderSelect = (orderId: number) => {
    setSelectedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  if (!orderList) {
    console.log('Order List is empty ');
    return null;
  }


  return (
  
    <Box display="flex" gap={0} height="100%">
      <Paper
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "20vw",
          width: "20vw",
          // maxWidth: 360,
          height: "100%",
          overflow: "hidden",
          p: 1,
        }}
      >
        <Box
          display={"flex"}
          flexDirection={"column"}
          gap={1}
          width="100%"
          height="100%"
          overflow="auto"
        >
          <Box
            display={"flex"}
            justifyContent={"center"}
            mb={1}
            sx={{ position: "relative" }}
          >
            <Typography variant="h5" fontWeight={"bold"} color="primary.dark">
              Tour Details
            </Typography>

          </Box>
          {/* Order List */}
          <Box
            // position="absolute"
            // right={30}
            // bottom={10}
            mb={2}
            p={2}
            bgcolor="white"
            borderRadius={2}
            // sx={{
            //   maxHeight: "calc(100vh - 30%)",
            //   maxWidth: 370,
            //   width: { md: 280, lg: 320 },
            //   pointerEvents: "auto",
            //   display: "flex",
            //   flexDirection: "column",
            //   gap: 1,
            // }}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexShrink={0}
            >
              <Typography>
                <Box component="span" color={"primary.dark"}>
                  {orderList.length}
                </Box>{" "}
                Orders
              </Typography>
            </Box>
            <Divider flexItem />
            <Box
              sx={{
                flex: 1,
                pr: 1,
                mt: 1,
                width: "100%",
                //   maxHeight: 600,
              }}
            >
            
            <List>
              {orderList.map((item, idx) => (
                <React.Fragment key={item.order_id}>
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
                    <IconButton   onClick={() => {
                              SelectForDelete(item); // Second method
                            }}>
                      <DeleteOutlineIcon />
                    </IconButton>
                  </ListItem>
                  {selectedOrderId === item.order_id && (
                    <DynamicTourOrderDetails order={item} />
                  )}
                </React.Fragment>
              ))}
            </List>
            <Box
              width="100%"
              display="flex"
              justifyContent="flex-end"
              gap={3}
              mt={2}
            >
              {pendingRemove ? (
                <Button
                  variant="contained"
                  color="success"
                  // onClick={updateDynamicTour}
                >
                  Update Tour Route
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    // onClick={() => setShowRejectModal(true)}
                  >
                    Reject
                  </Button>
                  <Button type="submit" variant="contained">
                    Accept
                  </Button>
                </>
              )}
            </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
      {/* Order Remove Confirmation Modal */}
      <Modal open={pendingDeleteIds.length > 0} onClose={() => setPendingDeleteIds([])}>
        <Box sx={{ ...modalStyle, width: 450 }}>
          <Typography variant="h5" mb={2}>
            Do you want to remove{" "}
            <Box component="span" fontWeight="bold">
              {/*Order {pendingRemove?.order?.order_number}*/}
            </Box>{" "}
            from the Tour?
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={3}>
            <Button
              variant="contained"
              color="error"
              onClick={confirmOrderRemove}
            >
              Remove
            </Button>
            <Button variant="outlined" onClick={() => setPendingDeleteIds([])}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>




  );
};
