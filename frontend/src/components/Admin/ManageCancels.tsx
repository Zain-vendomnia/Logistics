import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Snackbar,
  Alert,
  Stack,
  Typography,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Paper,
  TablePagination,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Edit,
  Delete,
  SaveAlt,
  KeyboardArrowDown,
  KeyboardArrowUp,
  ShoppingCart,
  ContentCopy,
  Clear,
} from "@mui/icons-material";
import TimelineIcon from "@mui/icons-material/Timeline";
import ExcelJS from "exceljs";
import {
  getAllCancelOrders,
  getCancelOrderItems,
  updateCancel,
  deleteCancel,
  deleteAllCancels,
  searchCancelByOrderNumber,
} from "../../services/cancelService";
import ConfirmDialog from "./ConfirmDialog";
import GenerateReturnPopup from "./GenerateReturnPopup";
import { OrderItem, PickupOrder } from "../../types/order.type";
import { getCurrentUser } from "../../services/auth.service";
import OrderHistory from "../orderHistory/OrderHistory";
import OrderStatusButton from "./OrderStatusButton";

const ManageCancels = () => {
  const [pickUpOrders, setPickupOrders] = useState<PickupOrder[]>([]);
  const [expandedRows, setExpandedRows] = useState<Map<string, OrderItem[]>>(
    new Map()
  );
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning" | "info",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<OrderItem | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [actionLoading, setActionLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openPopup, setOpenPopup] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(
    null
  );

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    content: "",
    confirmText: "Yes, Confirm",
    confirmColor: "error" as
      | "error"
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "info",
    onConfirm: () => {},
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => setSnackbar({ open: true, message, severity });
  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const closeConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      title: "",
      content: "",
      confirmText: "Yes, Confirm",
      confirmColor: "error",
      onConfirm: () => {},
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllCancelOrders();

      if (response.status === "success" && Array.isArray(response.data)) {
        setPickupOrders(response.data);
        // for (const pickUp of pickupRes) {
        //   setExpandedRows((prev) =>
        //     new Map(prev).set(pickUp.order_number, pickUp.items)
        //   );
        // }
      } else if (Array.isArray(response)) {
        setPickupOrders(response);
      } else {
        setPickupOrders([]);
        showSnackbar("No cancel orders available", "warning");
      }
    } catch (err: any) {
      console.error("Error loading orders:", err);
      setPickupOrders([]);
      showSnackbar(err.message || "Failed to load cancel orders", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      showSnackbar("Please enter an order number to search", "warning");
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      const response = await searchCancelByOrderNumber(searchTerm.trim());

      if (response.status === "success" && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          showSnackbar(`No cancel orders found for: ${searchTerm}`, "info");
        } else {
          showSnackbar(`Found ${response.data.length} order(s)`, "success");
        }
        setPickupOrders(response.data);
        setPage(0);
      } else {
        setPickupOrders([]);
        showSnackbar("No cancel orders found", "info");
      }
    } catch (err: any) {
      console.error("Error searching orders:", err);
      setPickupOrders([]);
      if (err.message && err.message.includes("404")) {
        showSnackbar(`No cancel orders found for: ${searchTerm}`, "info");
      } else {
        showSnackbar(err.message || "Failed to search cancel orders", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Simple clear function - clears search and shows all orders
  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearching(false);
    loadOrders();
  };

  // ✅ Handle Enter key to search
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const loadOrderItems = async (orderNumber: string) => {
    if (expandedRows.has(orderNumber)) {
      return;
    }

    setLoadingItems((prev) => new Set(prev).add(orderNumber));

    try {
      const response = await getCancelOrderItems(orderNumber);

      if (response.status === "success" && Array.isArray(response.data)) {
        setExpandedRows((prev) =>
          new Map(prev).set(orderNumber, response.data)
        );
      } else {
        showSnackbar("Failed to load order items", "error");
      }
    } catch (err: any) {
      console.error("Error loading order items:", err);
      showSnackbar(err.message || "Failed to load order items", "error");
    } finally {
      setLoadingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderNumber);
        return newSet;
      });
    }
  };

  const handleCopyOrderNumber = (orderNumber: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    showSnackbar(`Order number ${orderNumber} copied!`, "success");
  };

  const toggleRowExpansion = async (orderNumber: string) => {
    const isCurrentlyExpanded = expandedRows.has(orderNumber);

    if (!isCurrentlyExpanded) {
      await loadOrderItems(orderNumber);
    } else {
      setExpandedRows((prev) => {
        const newMap = new Map(prev);
        newMap.delete(orderNumber);
        return newMap;
      });
    }
  };

  // ✅ No client-side filtering - show API results directly
  const filteredOrders = pickUpOrders;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedOrders = filteredOrders.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleEditClick = (item: OrderItem) => {
    setEditItem(item);
    setEditQty(item.cancelled_quantity!);
    setEditDialog(true);
  };

  const handleEditSave = async () => {
    debugger;

    if (!editItem) return;

    if (editQty <= 0) {
      showSnackbar("Cancel quantity must be greater than 0", "error");
      return;
    }

    if (editQty > editItem.quantity) {
      showSnackbar(
        `Cancel quantity cannot exceed original quantity (${editItem.quantity})`,
        "error"
      );
      return;
    }

    const payload = {
      order_id: editItem.order_id,
      cancel_quantity: editQty,
      updated_by: getCurrentUser().email,
    };

    setActionLoading(true);
    try {
      const response = await updateCancel(editItem.id, payload);

      if (response.status === "success") {
        showSnackbar(
          response.message || "Cancel quantity updated successfully",
          "success"
        );
        setEditDialog(false);

        const orderNumber = Array.from(expandedRows.entries()).find(
          ([_, items]) => items.some((item) => item.id === editItem.id)
        )?.[0];

        if (orderNumber) {
          setExpandedRows((prev) => {
            const newMap = new Map(prev);
            newMap.delete(orderNumber);
            return newMap;
          });
          await loadOrderItems(orderNumber);
        }

        if (isSearching) {
          handleSearch();
        } else {
          loadOrders();
        }
      } else {
        showSnackbar(response.message || "Failed to update cancel", "error");
      }
    } catch (err: any) {
      console.error("Update error:", err);
      showSnackbar(err.message || "Failed to update cancel", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteItem = (id: number, orderNumber: string) => {
    setConfirmDialog({
      open: true,
      title: "Delete Cancel Item?",
      content: `Are you sure you want to delete this item from order ${orderNumber}?`,
      confirmText: "Yes, Delete",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          const response = await deleteCancel(id);

          if (response.status === "success") {
            showSnackbar(
              response.message || "Cancel item deleted successfully",
              "success"
            );

            setExpandedRows((prev) => {
              const newMap = new Map(prev);
              newMap.delete(orderNumber);
              return newMap;
            });
            await loadOrderItems(orderNumber);

            if (isSearching) {
              handleSearch();
            } else {
              loadOrders();
            }
          } else {
            showSnackbar(
              response.message || "Failed to delete cancel item",
              "error"
            );
          }
          closeConfirmDialog();
        } catch (err: any) {
          console.error("Delete error:", err);
          showSnackbar(err.message || "Failed to delete cancel item", "error");
          closeConfirmDialog();
        }
      },
    });
  };

  const handleDeleteAll = () => {
    if (pickUpOrders.length === 0) {
      showSnackbar("No cancels to delete", "warning");
      return;
    }

    setConfirmDialog({
      open: true,
      title: "Delete All Cancels?",
      content: "Are you sure you want to delete ALL cancel records?",
      confirmText: "Yes, Delete All",
      confirmColor: "error",
      onConfirm: async () => {
        try {
          const response = await deleteAllCancels();

          if (response.status === "success") {
            showSnackbar(
              response.message || "All cancels deleted successfully",
              "success"
            );
            setExpandedRows(new Map());
            setSearchTerm("");
            setIsSearching(false);
            loadOrders();
          } else {
            showSnackbar(
              response.message || "Failed to delete all cancels",
              "error"
            );
          }
          closeConfirmDialog();
        } catch (err: any) {
          console.error("Delete all error:", err);
          showSnackbar(err.message || "Failed to delete all cancels", "error");
          closeConfirmDialog();
        }
      },
    });
  };

  const handleExport = async () => {
    if (filteredOrders.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }

    try {
      showSnackbar("Preparing export... Please wait", "info");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Cancels");

      worksheet.columns = [
        { header: "Order Number", key: "order_number", width: 18 },
        { header: "Customer Name", key: "customer_name", width: 20 },
        { header: "Contact", key: "contact_number", width: 16 },
        { header: "Email", key: "email", width: 25 },
        { header: "Address", key: "address", width: 35 },
        { header: "Warehouse ID", key: "warehouse_id", width: 14 },
        { header: "Status", key: "status", width: 12 },
        { header: "Created By", key: "created_by", width: 16 },
        { header: "Created Date", key: "created_date", width: 16 },
        { header: "Article SKU", key: "article_sku", width: 20 },
        { header: "Original Qty", key: "quantity", width: 14 },
        { header: "Cancel Qty", key: "cancel_quantity", width: 14 },
      ];

      for (const order of filteredOrders) {
        try {
          const itemsResponse = await getCancelOrderItems(order.order_number);
          const items =
            itemsResponse.status === "success" ? itemsResponse.data : [];

          items.forEach((item: OrderItem) => {
            worksheet.addRow({
              order_number: order.order_number,
              customer_name: order.customer_name,
              contact_number: order.contact_number,
              email: order.email,
              address: order.address,
              warehouse_id: order.warehouse_id,
              status: order.status,
              created_by: order.created_by,
              created_date: formatDate(order.created_at),
              article_sku: item.article,
              quantity: item.quantity,
              cancel_quantity: item.cancelled_quantity,
            });
          });
        } catch (err) {
          console.error(
            `Failed to fetch items for order ${order.order_number}`,
            err
          );
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cancels_export_${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      showSnackbar("Export completed successfully!", "success");
    } catch (err: any) {
      console.error("Export error:", err);
      showSnackbar(err.message || "Failed to export data", "error");
    }
  };

  const handleOpenPopup = () => {
    setOpenPopup(true);
  };

  const handleClosePopup = () => {
    setOpenPopup(false);
  };

  const handleCancelSuccess = () => {
    if (isSearching) {
      handleSearch();
    } else {
      loadOrders();
    }
  };

  const ExpandableRow = ({ order }: { order: PickupOrder }) => {
    const isExpanded = expandedRows.has(order.order_number);
    const focusedPickupOrder = pickUpOrders.find(
      (po) => po.order_number === order.order_number
    );
    const itemsLoaded =
      focusedPickupOrder && focusedPickupOrder.items.length > 0;
    const items = itemsLoaded
      ? focusedPickupOrder!.items
      : expandedRows.get(order.order_number) || [];
    const isLoadingItems = loadingItems.has(order.order_number);

    return (
      <>
        <TableRow
          hover
          onClick={() => toggleRowExpansion(order.order_number)}
          sx={{ cursor: "pointer", "&:hover": { backgroundColor: "#f5f5f5" } }}
        >
          <TableCell>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight={600}>
                {order.order_number}
              </Typography>
              <Tooltip title="Copy Order Number">
                <IconButton
                  size="small"
                  onClick={(e) => handleCopyOrderNumber(order.order_number, e)}
                  sx={{ color: "#ff9800" }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight={500}>
              {order.customer_name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {order.contact_number}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2" color="text.secondary">
              {order.email}
            </Typography>
          </TableCell>
          <TableCell align="center">
            <Typography variant="body2">{order.warehouse_town}</Typography>
          </TableCell>
          <TableCell align="center">
            <Chip
              label={`${order.itemsCount} items`}
              size="small"
              sx={{
                backgroundColor: "#e3f2fd",
                color: "#1976d2",
                fontWeight: 600,
              }}
            />
          </TableCell>
          <TableCell align="center">
            <Typography variant="body1" fontWeight={600} color="error">
              {order.cancelledItemsCount}
            </Typography>
          </TableCell>
          <TableCell>
            <Typography variant="body2" fontWeight={500}>
              {formatDate(order.created_at)}
            </Typography>
          </TableCell>
          <TableCell>
            <Chip
              label={order.created_by}
              size="small"
              color="info"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          </TableCell>
          <TableCell align="right" sx={{ width: 50 }}>
            <IconButton size="small" sx={{ color: "#ff9800" }}>
              {isLoadingItems ? (
                <CircularProgress size={20} sx={{ color: "#ff9800" }} />
              ) : isExpanded ? (
                <KeyboardArrowUp />
              ) : (
                <KeyboardArrowDown />
              )}
            </IconButton>
          </TableCell>
          {/* Order Status */}
          <TableCell align="right" sx={{ width: 50 }}>
            <OrderStatusButton
              orderId={order.order_id}
              currentStatus={order.status}
              onStatusUpdated={(newStatus: string) => {
                showSnackbar(`Status updated to "${newStatus}"`, "success");
                loadOrders();
              }}
            />
          </TableCell>
        </TableRow>

        {/* Order items */}
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  margin: 2,
                  backgroundColor: "#fafafa",
                  p: 2,
                  borderRadius: 1,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent={"space-between"}
                  alignItems="center"
                  mb={2}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ShoppingCart sx={{ color: "#ff9800" }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Cancelled Items
                    </Typography>
                  </Stack>
                  <Button
                    variant="outlined"
                    endIcon={<TimelineIcon />}
                    sx={{ height: "35px" }}
                    onClick={() => {
                      setSelectedOrderNumber(order.order_number);
                      setShowHistory(true);
                    }}
                  >
                    History
                  </Button>
                </Stack>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={2}
                >
                  <strong>Address:</strong> {order.address}
                </Typography>

                {isLoadingItems ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", py: 4 }}
                  >
                    <CircularProgress sx={{ color: "#ff9800" }} />
                  </Box>
                ) : items.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    align="center"
                    py={2}
                  >
                    No items found
                  </Typography>
                ) : (
                  <Table size="small" sx={{ border: "1px solid #e0e0e0" }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#90a4ae" }}>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>
                          S.No
                        </TableCell>
                        <TableCell sx={{ color: "white", fontWeight: 600 }}>
                          Article SKU
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: "white", fontWeight: 600 }}
                        >
                          Original Qty
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: "white", fontWeight: 600 }}
                        >
                          Cancel Qty
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ color: "white", fontWeight: 600 }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow
                          key={item.id}
                          sx={{
                            backgroundColor:
                              index % 2 === 0 ? "white" : "#f5f5f5",
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.slmdl_articleordernumber}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">{item.quantity}</TableCell>
                          <TableCell align="center">
                            <Chip
                              label={item.cancelled_quantity!}
                              size="small"
                              color="error"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="center"
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(item);
                                }}
                                sx={{
                                  backgroundColor: "#ff9800",
                                  color: "white",
                                  "&:hover": { backgroundColor: "#f57c00" },
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteItem(item.id, order.order_number);
                                }}
                                sx={{
                                  backgroundColor: "#f44336",
                                  color: "white",
                                  "&:hover": { backgroundColor: "#d32f2f" },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <>
      <Box
        sx={{
          p: 3,
          backgroundColor: "#f5f5f5",
          minHeight: "calc(100vh - 50px)",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={600} color="#333">
            Manage Cancelled Orders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Total Orders: {filteredOrders.length} | Total Items:{" "}
            {filteredOrders.reduce((sum, order) => sum + order.itemsCount, 0)}
            {isSearching && (
              <Chip
                label="Search Results"
                size="small"
                color="primary"
                sx={{ ml: 1, fontWeight: 600 }}
              />
            )}
          </Typography>
        </Box>

        <Box
          sx={{
            backgroundColor: "white",
            p: 2,
            mb: 2,
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            flexWrap="wrap"
          >
            {/* ✅ Search field without auto-search */}
            <TextField
              placeholder="Search by order number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              size="small"
              sx={{ flexGrow: 1, minWidth: 300 }}
            />

            {/* ✅ Search Button - Required to trigger search */}
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!searchTerm.trim() || loading}
              sx={{
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                color: "white",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)",
                },
                "&:disabled": {
                  background: "#e0e0e0",
                  color: "#9e9e9e",
                },
              }}
            >
              Search
            </Button>

            <Button
              variant="contained"
              onClick={handleOpenPopup}
              sx={{
                backgroundColor: "#ff5722",
                color: "white",
                textTransform: "none",
                fontWeight: 600,
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: "0 2px 4px rgba(255, 87, 34, 0.3)",
                "&:hover": {
                  backgroundColor: "#f4511e",
                  boxShadow: "0 4px 8px rgba(255, 87, 34, 0.4)",
                },
              }}
            >
              Create Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleExport}
              startIcon={<SaveAlt />}
              disabled={filteredOrders.length === 0}
              sx={{
                background: "linear-gradient(45deg, #f7941d 30%, #f37021 90%)",
                color: "white",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #f37021 30%, #f7941d 90%)",
                },
              }}
            >
              Export Excel
            </Button>

            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteAll}
              startIcon={<Delete />}
              disabled={pickUpOrders.length === 0}
            >
              Delete All
            </Button>
          </Stack>
        </Box>

        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2 }}>
          <Box sx={{ height: "calc(100vh - 340px)", overflow: "auto" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Order Number
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Customer
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Email
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Warehouse
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Items Count
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Total Cancelled
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Created Date
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Created By
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                      width: 50,
                    }}
                  >
                    Expand
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      backgroundColor: "#90a4ae",
                      color: "white",
                      fontWeight: 600,
                      width: 50,
                    }}
                  >
                    Set Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <CircularProgress sx={{ color: "#ff9800" }} />
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {isSearching
                          ? `No results found for "${searchTerm}"`
                          : "No cancelled orders found"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <ExpandableRow key={order.order_number} order={order} />
                  ))
                )}
              </TableBody>
            </Table>
          </Box>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              backgroundColor: "#f5f5f5",
              borderTop: "1px solid #e0e0e0",
            }}
          />
        </Paper>

        <Dialog
          open={editDialog}
          onClose={() => setEditDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Edit Cancel Quantity</DialogTitle>
          <DialogContent>
            <Typography variant="body2" mb={1}>
              Item ID: <strong>{editItem?.id}</strong>
            </Typography>
            <Typography variant="body2" mb={1}>
              SKU: <strong>{editItem?.article}</strong>
            </Typography>
            <Typography variant="body2" mb={2} color="text.secondary">
              Original Quantity: <strong>{editItem?.quantity}</strong>
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Status"
              value={editQty}
              onChange={(e) => setEditQty(Number(e.target.value))}
              slotProps={{
                htmlInput: { min: 1, max: editItem?.quantity },
              }}
              helperText={`Must be between 1 and ${editItem?.quantity}`}
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setEditDialog(false)}
              variant="contained"
              sx={{
                background: "linear-gradient(45deg, #f7941d 30%, #f37021 90%)",
                color: "white",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #f37021 30%, #f7941d 90%)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              variant="contained"
              color="primary"
              disabled={actionLoading}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={confirmDialog.open}
          title={confirmDialog.title}
          content={confirmDialog.content}
          confirmText={confirmDialog.confirmText}
          confirmColor={confirmDialog.confirmColor}
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirmDialog}
        />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={closeSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={closeSnackbar}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        <GenerateReturnPopup
          open={openPopup}
          onClose={handleClosePopup}
          onSuccess={handleCancelSuccess}
        />
      </Box>

      {showHistory && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.3)",
            zIndex: 1200,
          }}
          onClick={() => setShowHistory(false)}
        />
      )}

      {showHistory && selectedOrderNumber && (
        <OrderHistory
          orderNumber={selectedOrderNumber}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
};

export default ManageCancels;
