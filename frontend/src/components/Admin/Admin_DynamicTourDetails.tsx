import React from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Modal,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import PaletteIcon from "@mui/icons-material/Palette";

import { useDynamicTourService } from "../../hooks/useDynamicTourService";
import { scrollStyles } from "../../../src/theme";
import useDynamicTourStore from "../../store/useDynamicTourStore";
import DynamicTourOrderDetails from "./Admin_DynamicTourOrderDetails";

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
  fontSize: "0.95rem",
};

const DynamicTourDetails = () => {
  const {
    warehouse,
    drivers,
    tourOrders,
    isOrderListUpdated,
    selectedOrderId,
    deleteTargetId,
    setDeleteTargetId,

    orderRef,

    orderToDelete,
    handleOrderRemove,
    hanldeOrderAdd,
    handleOrderSelect,
    generateTimeOptions,

    formData,
    today,
    theme,

    handleFormChange,
    handleTourSubmit,
    handleTourReject,
    newDynamicTour,
  } = useDynamicTourService();

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
            {isOrderListUpdated ? (
              <Button
                variant="contained"
                color="success"
                onClick={newDynamicTour}
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
            maxWidth: 320,
            width: { md: 280, lg: 320 },
            pointerEvents: "auto",
            display: "flex",
            flexDirection: "column",
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
            <IconButton color="primary" onClick={hanldeOrderAdd}>
              <AddCircleOutlineIcon />
            </IconButton>
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
              {tourOrders.map((order, idx) => (
                <React.Fragment key={order.order_id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ px: 0, m: 0 }}
                      onClick={() => handleOrderSelect(order.order_id)}
                    >
                      <ListItemText>
                        <Box
                          component={"span"}
                          fontSize={"medium"}
                          color={"primary.dark"}
                        >
                          {String(idx + 1).padStart(2, "0")}
                        </Box>{" "}
                        {order.order_number}
                      </ListItemText>
                    </ListItemButton>
                    <IconButton
                      onClick={() => setDeleteTargetId(order.order_id)}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </ListItem>
                  {selectedOrderId === order.order_id && (
                    <DynamicTourOrderDetails order={order} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </Box>
        </Box>
      </Box>

      {/* Remove Confirmation Modal */}
      <Modal
        open={deleteTargetId != null}
        onClose={() => setDeleteTargetId(null)}
      >
        <Box sx={{ ...modalStyle, width: 450 }}>
          <Typography variant="h5" mb={2}>
            Do you want to remove{" "}
            <Box component="span" fontWeight="bold">
              Order {orderToDelete?.order_number}
            </Box>{" "}
            from the Tour?
          </Typography>
          <Box display="flex" justifyContent="flex-end" gap={3}>
            <Button
              variant="contained"
              color="error"
              onClick={handleOrderRemove}
            >
              Remove
            </Button>
            <Button variant="outlined" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DynamicTourDetails;
