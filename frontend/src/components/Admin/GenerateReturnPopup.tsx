import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  TextField,
  Box,
  IconButton,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Alert,
  Typography,
  Snackbar,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import adminApiService from "../../services/adminApiService";

interface OrderItem {
  id: number;
  order_id?: number;
  order_number: string;
  slmdl_article_id: string;
  slmdl_articleordernumber: string;
  quantity: number;
  warehouse_id?: string;
  [key: string]: any;
}

interface SelectedItem {
  id: number;
  slmdl_articleordernumber: string;
  original_quantity: number;
  cancelled_quantity: number;
}

interface GenerateCancelPopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void; // ✅ Added this
}

interface pickupObject {
  order_id: number;
  orderItems: OrderItem[];
}

const GenerateCancelPopup: React.FC<GenerateCancelPopupProps> = ({
  open,
  onClose,
  onSuccess, // ✅ Added this
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [pickUp, setPickUp] = useState<pickupObject | null>(null);
  // const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<{
    [key: number]: SelectedItem;
  }>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    "success" | "error" | "info" | "warning"
  >("success");

  const getUserData = () => {
    try {
      const userDataString =
        localStorage.getItem("userData") || localStorage.getItem("user");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        return {
          user_id: userData.user_id || null,
          username: userData.username || null,
          email: userData.email || null,
        };
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
    }
    return { user_id: null, username: null, email: null };
  };

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "info" | "warning"
  ) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSearch = async () => {
    if (!invoiceNumber.trim()) {
      setErrorMessage("Please enter an invoice number");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");
      // setOrderItems();
      setSelectedItems({});

      const response = await adminApiService.orderDetails(
        Number(invoiceNumber)
      );
      console.log("Order Details Response:", response);

      if (response.data.status === "success") {
        const resObject = response.data.data || [];
        const items = resObject.orderItems;
        // debugger;
        if (items.length === 0) {
          setErrorMessage("No items found for this order number");
        } else {
          setPickUp(resObject);
          setSuccessMessage(
            `Found ${items.length} item(s) for order ${invoiceNumber}`
          );
        }
      } else if (response.data.status === "warning") {
        setErrorMessage(response.data.message);
      } else {
        setErrorMessage(
          response.data.message || "Failed to fetch order details"
        );
      }
    } catch (error: any) {
      console.error("Error fetching order details:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to fetch order details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setInvoiceNumber(value);
    if (errorMessage || successMessage) {
      setErrorMessage("");
      setSuccessMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/[0-9]/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab"
    ) {
      e.preventDefault();
    }

    if (e.key === "Enter" && invoiceNumber.trim()) {
      handleSearch();
    }
  };

  const handleCheckboxChange = (item: OrderItem, checked: boolean) => {
    if (checked) {
      setSelectedItems((prev) => ({
        ...prev,
        [item.id]: {
          id: item.id,
          slmdl_articleordernumber: item.slmdl_articleordernumber,
          original_quantity: item.quantity,
          cancelled_quantity: 0,
        },
      }));
    } else {
      setSelectedItems((prev) => {
        const newItems = { ...prev };
        delete newItems[item.id];
        return newItems;
      });
    }
  };

  const handleQuantityChange = (itemId: number, value: string) => {
    const numValue = parseInt(value) || 0;

    setSelectedItems((prev) => {
      const item = prev[itemId];
      if (!item) return prev;

      if (numValue > item.original_quantity) {
        return prev;
      }

      return {
        ...prev,
        [itemId]: {
          ...item,
          cancelled_quantity: numValue,
        },
      };
    });
  };

  const handleCreate = async () => {
    const selectedItemsList = Object.values(selectedItems);

    if (selectedItemsList.length === 0) {
      setErrorMessage("Please select at least one item");
      return;
    }

    const hasValidQuantity = selectedItemsList.some(
      (item) => item.cancelled_quantity > 0
    );

    if (!hasValidQuantity) {
      setErrorMessage("Please enter cancel quantity for selected items");
      return;
    }

    const { email: username } = getUserData();

    if (!username) {
      setErrorMessage("User information not found. Please log in again.");
      showSnackbar("User information not found. Please log in again.", "error");
      return;
    }
    // debugger;
    const pickupReq = {
      order_id: pickUp?.order_id,
      user_id: username,
      items: selectedItemsList.map((item) => {
        const fullItem = pickUp?.orderItems.find(
          (orderItem) => orderItem.id === item.id
        );

        return {
          id: item.id,
          order_id: fullItem?.order_id || null,
          order_number: fullItem?.order_number || invoiceNumber,
          slmdl_articleordernumber: item.slmdl_articleordernumber,
          quantity: item.original_quantity,
          cancelled_quantity: item.cancelled_quantity,
          warehouse_id: fullItem?.warehouse_id || null,
        };
      }),
    };

    console.log("Creating cancel with data:", pickupReq);

    // 400271854
    try {
      setLoading(true);
      debugger;

      const response = await adminApiService.sendCancelDetails(pickupReq);

      console.log("Cancel created successfully:", response);

      if (response.data.status === "success") {
        showSnackbar("Cancel created successfully!", "success");

        setInvoiceNumber("");
        setPickUp(null);
        setSelectedItems({});
        setErrorMessage("");
        setSuccessMessage("");

        // ✅ ONLY ADDED THIS - Call onSuccess to refresh parent table
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setErrorMessage(response.data.message || "Failed to create cancel");
        showSnackbar(
          response.data.message || "Failed to create cancel",
          "error"
        );
      }
    } catch (error: any) {
      console.error("Error creating cancel:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to create cancel. Please try again.";
      setErrorMessage(errorMsg);
      showSnackbar(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInvoiceNumber("");
    setPickUp(null);
    setSelectedItems({});
    setErrorMessage("");
    setSuccessMessage("");
    onClose();
  };

  const isItemSelected = (itemId: number) => !!selectedItems[itemId];

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
            minHeight: "375px",
          },
        }}
      >
        <IconButton
          onClick={handleClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: "#9e9e9e",
          }}
        >
          <CloseIcon />
        </IconButton>

        <DialogTitle sx={{ pb: 1, pt: 3, textAlign: "center" }}>
          <Typography variant="h5" fontWeight={600}>
            Create Cancel
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", gap: 2, mb: 2, mt: 3 }}>
            <TextField
              fullWidth
              placeholder="Enter invoice number"
              value={invoiceNumber}
              onChange={handleInvoiceChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
              size="small"
              autoFocus
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !invoiceNumber.trim()}
              sx={{
                minWidth: "100px",
                bgcolor: "#f7941d",
                "&:hover": { bgcolor: "#f37021" },
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Search"
              )}
            </Button>
          </Box>

          {errorMessage && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setErrorMessage("")}
            >
              {errorMessage}
            </Alert>
          )}
          {successMessage && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
              onClose={() => setSuccessMessage("")}
            >
              {successMessage}
            </Alert>
          )}

          {pickUp && pickUp.orderItems.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 400 }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Article Order Number</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="center">Cancel</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pickUp?.orderItems.map((item) => {
                      const selectedItem = selectedItems[item.id];
                      const isSelected = isItemSelected(item.id);

                      return (
                        <TableRow key={item.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              checked={isSelected}
                              onChange={(e) =>
                                handleCheckboxChange(item, e.target.checked)
                              }
                            />
                          </TableCell>
                          <TableCell>{item.slmdl_articleordernumber}</TableCell>
                          <TableCell align="center">
                            <strong>{item.quantity}</strong>
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              type="number"
                              size="small"
                              disabled={!isSelected}
                              value={selectedItem?.cancelled_quantity || ""}
                              onChange={(e) =>
                                handleQuantityChange(item.id, e.target.value)
                              }
                              inputProps={{
                                min: 0,
                                max: item.quantity,
                                style: { textAlign: "center", width: "60px" },
                              }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  "& fieldset": {
                                    borderColor: isSelected
                                      ? "#000000"
                                      : "#e0e0e0",
                                    borderWidth: isSelected ? "2px" : "1px",
                                  },
                                  "&:hover fieldset": {
                                    borderColor: isSelected
                                      ? "#333333"
                                      : "#e0e0e0",
                                  },
                                  "&.Mui-focused fieldset": {
                                    borderColor: "#f7941d",
                                    borderWidth: "2px",
                                  },
                                  "&.Mui-disabled": {
                                    backgroundColor: "#f5f5f5",
                                  },
                                },
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={handleCreate}
                  disabled={Object.keys(selectedItems).length === 0}
                  sx={{
                    bgcolor: "#f7941d",
                    "&:hover": { bgcolor: "#f37021" },
                  }}
                >
                  Create
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ maxHeight: 400 }}
              >
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox"></TableCell>
                      <TableCell>Article Order Number</TableCell>
                      <TableCell align="center">Qty</TableCell>
                      <TableCell align="center">Cancel</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{ py: 4, color: "text.secondary" }}
                      >
                        No data available
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GenerateCancelPopup;
