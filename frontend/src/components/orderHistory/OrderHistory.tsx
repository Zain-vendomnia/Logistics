import { useCallback, useEffect, useState } from "react";

import {
  Backdrop,
  Box,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { OrderHistoryUI } from "../../types/order.type";
import adminApiService from "../../services/adminApiService";
import OrderHistoryContent from "./OrderHistoryContent";

interface Props {
  orderNumber: string;
  onClose: () => void;
}

const OrderHistory = ({ orderNumber, onClose }: Props) => {
  const [history, setHistory] = useState<OrderHistoryUI | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await adminApiService.orderHistoryDetails(+orderNumber);
      if (!response || !response.data) setHistory(null);

      setHistory(response.data.data);
    } finally {
      // catch(err){    }
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 450,
        bgcolor: "background.paper",
        boxShadow: "-4px 0 12px rgba(0,0,0,0.15)",
        zIndex: 1300,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Order Number: {orderNumber}
        </Typography>

        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 1,
        }}
      >
        {/* <Backdrop
          sx={(theme) => ({ color: "#fff", zIndex: 1 })}
          open={loading}
          // onClick={handleClose}
        >
          
        </Backdrop> */}
        {loading && <CircularProgress color="inherit" />}

        {!loading && !history && (
          <Typography color="text.secondary">
            No order history available
          </Typography>
        )}

        {history && <OrderHistoryContent data={history} />}
      </Box>
    </Box>
  );
};
export default OrderHistory;
