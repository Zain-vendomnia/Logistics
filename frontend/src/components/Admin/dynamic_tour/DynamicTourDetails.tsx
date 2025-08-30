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
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PaletteIcon from "@mui/icons-material/Palette";

import { motion, AnimatePresence } from "framer-motion";

import { useDynamicTourService } from "../../../hooks/useDynamicTourService";
import { scrollStyles } from "../../../theme";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import { DynamicOrdersList } from "./DynamicOrdersList";
import { Order } from "../../../types/order.type";

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
    {} as Record<number, Order[]>
  );

  const warehouseMap = Object.fromEntries(
    pinboard_OrderList.map((o) => [o.warehouse_id, o.warehouse_name!])
  );

  const [expanded, setExpanded] = useState(false);

  const {
    loading,
    warehouse,
    drivers,
    tourOrders,
    shouldUpdateTourRoute,

    selectedPinbOrders,
    handleSelectPinbOrder,
    pinboardOrderSearch,

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

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
        open={loading}
        // onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

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
          <Box display={"flex"} justifyContent={"space-between"} width="100%">
            <Stack spacing={-0.5}>
              <Badge
                badgeContent={`zip:${warehouse?.zipcode}`}
                color="primary"
              />
              <Typography variant="h4">{warehouse?.town}</Typography>

              <Typography variant="subtitle2">
                [{warehouse?.zip_codes_delivering}]
              </Typography>
            </Stack>
            <Stack spacing={-0.5}>
              <Typography variant="subtitle2">
                Name: {warehouse?.name}
              </Typography>
              <Typography variant="subtitle2">
                Add: {warehouse?.address}
              </Typography>
            </Stack>
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
              required
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
                <Typography variant="subtitle2">Route Color:</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  component="input"
                  type="color"
                  name="routeColor"
                  value={warehouse?.colorCode || formData.routeColor}
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
                    backgroundColor:
                      warehouse?.colorCode || formData.routeColor,
                    color: theme.palette.getContrastText(
                      warehouse?.colorCode || formData.routeColor
                    ),
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
                Update Tour Route
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
                    animate={{ width: "170px", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duraion: 0.3 }}
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
              width:'100%',
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
