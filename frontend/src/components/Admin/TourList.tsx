import DynamicTourDetails from "./dynamic_tour/DynamicTourDetails";
import { useState } from "react";
import {
  Autocomplete,
  Backdrop,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FilledInput,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListSubheader,
  MenuItem,
  Modal,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
  Paper
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PaletteIcon from "@mui/icons-material/Palette";

import { motion, AnimatePresence } from "framer-motion";

import { useDynamicTourService } from "./../../hooks/useDynamicTourService";
import { scrollStyles } from "./../../theme";
import useDynamicTourStore from "./../../store/useDynamicTourStore";
import { DynamicOrdersList } from "./dynamic_tour/DynamicOrdersList";
import { Order } from "./../../types/order.type";
import { RejectTourModal } from "./dynamic_tour/RejectTourModal";

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

const formStyle = {
  fieldWidth: 190,
  fontSize: "1rem",
};


const TourList = () => {
  const { pinboard_OrderList } = useDynamicTourStore();

  const groupedPinbOrders = pinboard_OrderList.reduce(
    (acc, order) => {
      if (!acc[order.warehouse_id]) acc[order.warehouse_id] = [];

      acc[order.warehouse_id].push(order);
      return acc;
    },
    {} as Record<number, Order[]>
  );

  const warehouseMap = Object.fromEntries(
    pinboard_OrderList.map((o) => [o.warehouse_id, o.warehouse_name!])
  );

  const [expanded, setExpanded] = useState(false);

  const {
    showRejectModal,
    setShowRejectModal,
    loading,
    warehouse,
    drivers,
    tourOrders,
    shouldUpdateTourRoute,

    selectedPinbOrders,
    handleSelectPinbOrder,

    handleOrderRemove,

    generateTimeOptions,

    formData,
    today,
    theme,

    handleFormChange,
    handleTourSubmit,
    handleTourReject,
    updateDynamicTour,
  } = useDynamicTourService();

  // console.log("Warehouse Selected: ", warehouse);
  const [pendingRemove, setPendingRemove] = useState<{
    type: "torders" | "porders";
    order: Order;
  } | null>(null);
  const requestOrderRemove = (type: "torders" | "porders", order: Order) => {
    setPendingRemove({ type, order });
  };
  const confirmOrderRemove = () => {
    if (!pendingRemove) return;

    handleOrderRemove(pendingRemove.type, pendingRemove.order.order_id);
    setPendingRemove(null);
  };
  console.log('tourOrders : ', tourOrders);
  return (
    <>
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
                    {tourOrders.length}
                  </Box>{" "}
                  Orders
                </Typography>

                <Box display="flex" alignItems={"center"} gap={1}>
                  <AnimatePresence mode="wait">
                    {!expanded ? (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.25 }}
                      >
                        <IconButton
                          color="primary"
                          onClick={() => setExpanded((prev) => !prev)}
                        >
                          <AddCircleOutlineIcon />
                        </IconButton>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="select"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "170px", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ overflow: "hidden", maxWidth: "180px" }}
                      >
                        <Autocomplete
                          multiple
                          disableCloseOnSelect
                          options={pinboard_OrderList}
                          getOptionLabel={(option) => option.order_number}
                          groupBy={(option) => option.warehouse_town!}
                          value={selectedPinbOrders}
                          onChange={(_, newValue) =>
                            handleSelectPinbOrder(newValue)
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.order_id === value.order_id
                          }
                          renderTags={() => null} // hides chips
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder={
                                selectedPinbOrders.length > 0
                                  ? "Selected Orders"
                                  : "Select Orders"
                              }
                              size="small"
                              sx={{
                                mt: 0,
                                top: 0,
                                pt: 0,
                                width: "160px",
                                "& .MuiInputBase-input": {
                                  fontSize: "1.1rem",
                                  // padding: "4px 6px",
                                },
                              }}
                            />
                          )}
                          slotProps={{
                            listbox: {
                              sx: {
                                "& .MuiAutocomplete-groupLabel": {
                                  fontWeight: "bold",
                                  fontSize: "1.07rem",
                                  color: "primary.main",
                                  backgroundColor: "rgba(0,0,0,0.04)", // subtle bg highlight
                                  px: 1,
                                  // py: 0.2,
                                },
                                "& .MuiAutocomplete-option": {
                                  fontSize: "1rem",
                                  padding: "4px 16px",
                                },
                              },
                            },
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>
              </Box>
              <Divider flexItem />
              <Box
                sx={{
                  flex: 1,
                  pr: 1,
                  mt: 1,
                  width: "100%",
                  //   maxHeight: 600,
                  ...scrollStyles(theme),
                }}
              >
                <List>
                  {selectedPinbOrders.length > 0 && (
                    <Stack spacing={1} width="100%">
                      <Typography color="primary">Add Orders</Typography>
                      <DynamicOrdersList
                        items={selectedPinbOrders}
                        handleDelete={(orderItem) =>
                          requestOrderRemove("porders", orderItem)
                        }
                      />
                      <Divider />
                      <Typography color="primary" sx={{ py: 1 }}>
                        Tour Orders
                      </Typography>
                    </Stack>
                  )}
                  <DynamicOrdersList
                    items={tourOrders}
                    handleDelete={(orderItem) =>
                      requestOrderRemove("torders", orderItem)
                    }
                  />
                </List>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>

    </>
  );
};

export default TourList;

