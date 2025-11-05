import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp,
  LocalShipping,
  AccessTime,
  Scale,
} from "@mui/icons-material";
import WarningIcon from "@mui/icons-material/Warning";
import CircularProgress from "@mui/material/CircularProgress";

import { Order } from "../../../types/order.type";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { TourMatrix } from "../../../types/tour.type";
import adminApiService from "../../../services/adminApiService";
import {
  NotificationSeverity,
  useNotificationStore,
} from "../../../store/useNotificationStore";

interface Props {
  warehouseId: number;
  orders: Order[];
  onError?: (isError: boolean) => void;
}

const TourImpactPreview = ({ warehouseId, orders, onError }: Props) => {
  const theme = useTheme();
  const { showNotification } = useNotificationStore();

  const [loading, setLoading] = useState(false);
  const [expected, setExpected] = useState<TourMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lastQueryRef = useRef<{
    key: string;
    data: TourMatrix | null;
    failed?: boolean;
  }>({
    key: "",
    data: null,
    failed: false,
  });

  const queryKey = useMemo(() => {
    const sortedOrderIds = orders.map((o) => o.order_id).sort((a, b) => a - b);
    console.log("sortedOrderIds: ", sortedOrderIds);
    return `${warehouseId || "none"}:${sortedOrderIds.join(",")}`;
  }, [warehouseId, orders]);

  const estimate = async (warehouseId: number, orderIds: number[]) => {
    setLoading(true);
    setError(null);

    try {
      const res = await adminApiService.estimateTourMatrix(
        warehouseId,
        orderIds
      );
      if (!res.data.success) {
        const msg = res.data.message || "Unable to calculate optimized route.";
        setError(msg);
        lastQueryRef.current = { key: queryKey, data: null, failed: true };
        onError?.(true);
        return;
      }
      const matrix: TourMatrix = res.data.data;
      console.log("API Response: ", res.data.data);
      setExpected(matrix);
      lastQueryRef.current = {
        key: queryKey,
        data: res.data.data,
        failed: false,
      };
      onError?.(false);
    } catch (err: any) {
      const rawmsg =
        err?.response?.data?.message ||
        err?.message ||
        "Unexpected error while estimating route.";
      const errorMessage = rawmsg.split(".");
      showNotification({
        title: "Tour Estimation Error",
        message: errorMessage[0],
        severity: NotificationSeverity.Warning,
      });
      setError(errorMessage[1] || "Failed to estimate tour cost.");
      lastQueryRef.current = { key: queryKey, data: null, failed: true };
      onError?.(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!warehouseId || !orders.length || orders.length <= 0) return;

    const last = lastQueryRef.current;
    if (last.key === queryKey && (last.data || last.failed)) {
      setExpected(last.data);

      return;
    }
    const orderIds = orders.map((o) => o.order_id);
    estimate(warehouseId, orderIds);
  }, [warehouseId, orders]);

  const metrics = [
    {
      label: "Weight",
      value: expected?.totalWeightKg.toFixed(0) ?? "00",
      unit: "kg",
      icon: <Scale sx={{ color: theme.palette.success.main }} />,
    },
    {
      label: "Distance",
      value: expected?.totalDistanceKm.toFixed(0) ?? "00",
      unit: "km",
      icon: <LocalShipping sx={{ color: theme.palette.info.main }} />,
    },
    {
      label: "Duration",
      value: expected?.totalDurationHrs.toFixed(2) ?? "00",
      unit: "hr",
      icon: <AccessTime sx={{ color: theme.palette.warning.main }} />,
    },
    {
      label: "Cost",
      value: expected?.totalCost.toFixed(0) ?? "00",
      unit: "$",
      icon: <TrendingUp sx={{ color: theme.palette.primary.main }} />,
    },
  ];

  const ErrorBox = (
    <Box
      display={"flex"}
      alignItems={"center"}
      justifyContent={"space-around"}
      width={"100%"}
    >
      <WarningIcon fontSize="large" color="error" />
      <Box>
        <Typography variant="subtitle1" color="error" fontWeight={600} mt={1}>
          {error}
        </Typography>
        <Typography variant="body2" color="error" mt={0.5}>
          Please review your orders selection and try again.
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: (theme) => theme.zIndex.drawer + 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box
          display="flex"
          justifyContent={"center"}
          alignItems={"center"}
          position="absolute"
          top={55}
          right={150}
          bgcolor="white"
          borderRadius={3}
          boxShadow="0 4px 12px rgba(0,0,0,0.7)"
          //   height={140}
          width={490}
          sx={{
            border: theme.palette.primary.dark,
            pointerEvents: "auto",
            gap: 2,
            p: 2,
          }}
        >
          {error ? (
            ErrorBox
          ) : (
            <Stack direction="row" spacing={3}>
              {metrics.map((metric) => (
                <Stack
                  key={metric.label}
                  alignItems="center"
                  spacing={1}
                  sx={{
                    minWidth: 90,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    "&:hover": {
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="primary.light"
                    sx={{ mb: 0.5 }}
                  >
                    {metric.label}
                  </Typography>

                  <Box
                    sx={{
                      border: !loading
                        ? `2px solid ${theme.palette.primary.light}`
                        : "none",
                      borderRadius: "50%",
                      width: 76,
                      height: 76,
                      display: "flex",
                      gap: -1,
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                      backgroundColor: `${theme.palette.grey[100]}`,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
                        backgroundColor: theme.palette.grey[50],
                      },
                    }}
                  >
                    <Box sx={{ mb: 0.5 }}>{metric.icon}</Box>
                    {!loading ? (
                      <Typography variant="subtitle1" fontWeight={700} p={0}>
                        {metric.value}

                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 0.5 }}
                        >
                          {metric.unit}
                        </Typography>
                      </Typography>
                    ) : (
                      <CircularProgress size={"1rem"} thickness={5} />
                    )}
                  </Box>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </motion.div>
    </Box>
  );
};

export default TourImpactPreview;
