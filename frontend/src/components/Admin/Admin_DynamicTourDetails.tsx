import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListSubheader,
  MenuItem,
  Modal,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PaletteIcon from "@mui/icons-material/Palette";

import { motion, AnimatePresence } from "framer-motion";

import { useDynamicTourService } from "../../hooks/useDynamicTourService";
import { scrollStyles } from "../../../src/theme";
import useDynamicTourStore from "../../store/useDynamicTourStore";
import { OrdersList } from "./common/OrdersList";
import { Order, PinboardOrder } from "../../types/order.type";
import adminApiService from "../../services/adminApiService";

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

const DynamicTourDetails = () => {
  const { pinboard_OrderList } = useDynamicTourStore();

  const groupedPinbOrders = pinboard_OrderList.reduce(
    (acc, order) => {
      if (!acc[order.warehouse_id]) acc[order.warehouse_id] = [];

      acc[order.warehouse_id].push(order);
      return acc;
    },
    {} as Record<number, PinboardOrder[]>
  );
  const warehouseMap = Object.fromEntries(
    pinboard_OrderList.map((o) => [o.warehouse_id, o.warehouse])
  );
  const [expanded, setExpanded] = useState(false);
  // const [selectedPinbOrders, setSelectedPinbOrders] = useState<Order[]>([]);

  // selected pinboard orders

  const {
    warehouse,
    drivers,
    tourOrders,
    shouldUpdateTourRoute,
    // deleteTargetId,
    // setDeleteTargetId,

    selectedPinbOrders,
    handleSelectPinbOrder,

    removeOrderId,
    setRemoveOrderId,
    orderToDelete,
    handleOrderRemove,

    // hanldeOrderAdd,
    handleOrderSelect,
    generateTimeOptions,

    formData,
    today,
    theme,

    handleFormChange,
    handleTourSubmit,
    handleTourReject,
    updateDynamicTour,

    // pinboardOrderSearch,
  } = useDynamicTourService();

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

  const pinboardOrderSearch = () => {
    return;
  };

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: (theme) => theme.zIndex.drawer + 2,
        }}
      >
        {/* Warehouse Details Form */}
        <Box
          component="form"
          onSubmit={handleTourSubmit}
          position="absolute"
          top={10}
          left={10}
          width={{ xs: "95%", sm: 480 }}
          bgcolor="white"
          p={3}
          borderRadius={2}
          sx={{
            pointerEvents: "auto",
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box width="100%">
            <Typography variant="h4" gutterBottom>
              {warehouse?.warehouse_name}
            </Typography>
          </Box>

          <Box
            width="100%"
            display="flex"
            alignItems="space-between"
            justifyContent="space-between"
            gap={2}
          >
            <TextField
              type="date"
              name="tourDate"
              value={formData.tourDate}
              onChange={handleFormChange}
              size="small"
              fullWidth
              //   required
              sx={{
                "& .MuiInputBase-input": { fontSize: formStyle.fontSize }, // input text
                flex: "1 1 45%",
              }}
              slotProps={{
                htmlInput: { min: today },
              }}
            />

            <FormControl sx={{ width: formStyle.fieldWidth }} size="small">
              <InputLabel sx={{ fontSize: formStyle.fontSize, top: "-6px" }}>
                Start Time*
              </InputLabel>
              <Select
                name="startTime"
                value={formData.startTime}
                onChange={handleFormChange}
                required
                // sx={{ fontSize: formStyle.fontSize }}
                input={
                  <OutlinedInput
                    label="Start Date"
                    sx={{ fontSize: formStyle.fontSize, flex: "1 1 45%" }}
                  />
                }
              >
                {generateTimeOptions().map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box display="flex" justifyContent={"flex-end"} flex="1 1 45%">
            <Box flex="1 1 45%">
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <PaletteIcon fontSize="small" color="action" />
                <Typography variant="body2">Route Color:</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  component="input"
                  type="color"
                  name="routeColor"
                  value={formData.routeColor}
                  onChange={handleFormChange}
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                    cursor: "pointer",
                  }}
                />
                <Chip
                  label={formData.routeColor.toUpperCase()}
                  size="small"
                  sx={{
                    backgroundColor: formData.routeColor,
                    color: theme.palette.getContrastText(formData.routeColor),
                    minWidth: 80,
                  }}
                />
              </Box>
            </Box>

            <FormControl sx={{ width: formStyle.fieldWidth }} size="small">
              <InputLabel sx={{ fontSize: formStyle.fontSize, top: "-6px" }}>
                Driver*
              </InputLabel>
              <Select
                name="driverId"
                value={formData.driverId}
                onChange={handleFormChange}
                input={
                  <OutlinedInput
                    label="Driver"
                    sx={{ fontSize: formStyle.fontSize }}
                  />
                }
                required
              >
                <MenuItem
                  value=""
                  disabled
                  sx={{ fontSize: formStyle.fontSize }}
                >
                  <em>Select Driver</em>
                </MenuItem>
                {drivers.map((drvr, idx) => (
                  <MenuItem
                    key={idx}
                    value={drvr.id}
                    sx={{ fontSize: formStyle.fontSize }}
                    disabled={drvr.status === 0}
                  >
                    {drvr.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            width="100%"
            display="flex"
            justifyContent="flex-end"
            gap={3}
            mt={2}
          >
            {shouldUpdateTourRoute ? (
              <Button
                variant="contained"
                color="success"
                onClick={updateDynamicTour}
              >
                New Tour Route
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleTourReject}
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

        {/* Order List */}
        <Box
          position="absolute"
          right={30}
          bottom={10}
          mb={2}
          p={2}
          bgcolor="white"
          borderRadius={2}
          sx={{
            maxHeight: "calc(100vh - 30%)",
            maxWidth: 370,
            width: { md: 280, lg: 320 },
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
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
                    exit={{ apacity: 0, scale: 0.6 }}
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
                    animate={{ width: "160px", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duraion: 0.3 }}
                    style={{ overflow: "hidden", maxWidth: "180px" }}
                  >
                    <FormControl sx={{ width: "160px" }} size="small">
                      <InputLabel
                        htmlFor="porders-select"
                        sx={{ fontSize: formStyle.fontSize, top: -5 }}
                      >
                        {selectedPinbOrders.length > 0
                          ? "Selected Orders"
                          : "Select Orders"}
                      </InputLabel>
                      <Select
                        id="porders-select"
                        label="Select orders"
                        multiple
                        value={selectedPinbOrders.map((o) =>
                          o.order_id.toString()
                        )}
                        onChange={handleSelectPinbOrder}
                        onClose={() => setExpanded(false)} // Collapse
                      >
                        {Object.entries(groupedPinbOrders).map(
                          ([warehouseId, pOrders]) => [
                            // <React.Fragment key={`header-${warehouseId}`}>
                            <ListSubheader
                              key={`header-${warehouseId}`}
                              sx={{ fontSize: "1.2rem", fontWeight: "bold" }}
                            >
                              {warehouseMap[Number(warehouseId)]}
                            </ListSubheader>,
                            pOrders.map((po) => (
                              <MenuItem key={po.id} value={po.id}>
                                {po.order_number}
                              </MenuItem>
                            )),
                            // </React.Fragment>
                          ]
                        )}
                      </Select>
                    </FormControl>
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
              //   maxHeight: 600,
              ...scrollStyles(theme),
            }}
          >
            <List>
              {selectedPinbOrders.length > 0 && (
                <Stack spacing={1} width="100%">
                  <Typography color="primary">Add Orders</Typography>
                  <OrdersList
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
              <OrdersList
                items={tourOrders}
                handleDelete={(orderItem) =>
                  requestOrderRemove("torders", orderItem)
                }
              />
            </List>
          </Box>
        </Box>
      </Box>

      {/* Remove Confirmation Modal */}
      <Modal open={!!pendingRemove} onClose={() => setPendingRemove(null)}>
        <Box sx={{ ...modalStyle, width: 450 }}>
          <Typography variant="h5" mb={2}>
            Do you want to remove{" "}
            <Box component="span" fontWeight="bold">
              Order {pendingRemove?.order?.order_number}
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
            <Button variant="outlined" onClick={() => setPendingRemove(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DynamicTourDetails;
