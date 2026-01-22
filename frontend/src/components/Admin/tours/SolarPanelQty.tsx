import {
  Box,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useState, useCallback, useEffect } from "react";
import { OrderItem, SolarModule } from "../../../types/order.type";
import { tourService } from "../../../services/tour.service";
import { debug } from "console";

interface Props {
  orderItems: OrderItem[];
}
const SolarPanelQty = ({ orderItems }: Props) => {
  const [tourOrderItems, setTourOrderItems] = useState<Map<string, number>>(
    new Map(),
  );

  const [solarModules, setSolarModules] = useState<SolarModule[]>([]);

  const loadModules = useCallback(async () => {
    const modules = await tourService.getSolarModules();
    setSolarModules(modules);
  }, []);

  useEffect(() => {
    loadModules();
  }, []);

  useEffect(() => {
    if (!orderItems) return;

    const map = new Map<string, number>();

    orderItems.forEach((item) => {
      const article = item.slmdl_articleordernumber!;
      const qty = item.quantity ?? 0;
      map.set(article, (map.get(article) ?? 0) + qty);
    });

    setTourOrderItems(map);
  }, [orderItems]);

  const showWeightChart = (
    <Stack spacing={0.5}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          px: 2,
          mb: 0.5,
        }}
      >
        <Typography variant="caption" fontWeight={600}>
          Module
        </Typography>
        <Typography variant="caption" fontWeight={600}>
          Weight
        </Typography>
      </Box>
      {[...solarModules]
        .sort((a, b) => a.weight - b.weight)
        .map((module, index) => (
          <Box
            key={module.id}
            sx={{
              px: 1,
              py: 0.5,
              bgcolor: index % 2 === 0 ? "transparent" : "grey.300",
              borderRadius: 1,
            }}
          >
            <Typography
              variant="subtitle2"
              noWrap
              display={"flex"}
              justifyContent={"space-between"}
            >
              <span>{module.name} </span> <span>{module.weight} kg</span>
            </Typography>
          </Box>
        ))}
    </Stack>
  );

  return (
    <Box display={"flex"} flexDirection={"column"}>
      <Typography variant="h6" fontWeight={"bold"}>
        Solar Panels
      </Typography>

      <Table
        size="small"
        sx={{
          "& td": { fontSize: "0.9rem", px: 0.5 },
          "& th": { fontSize: "0.9rem", fontWeight: "bold", textAlign: "left" },
        }}
      >
        <TableRow>
          <TableCell align="left">
            Article
            <Tooltip
              title={showWeightChart}
              arrow
              placement="top"
              enterTouchDelay={300}
              leaveTouchDelay={3000}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "background.paper",
                    color: "text.primary",
                    boxShadow: 3,
                    borderRadius: 2,
                    p: 1.5,
                    maxWidth: 280,
                  },
                },
                arrow: {
                  sx: {
                    color: "background.paper",
                  },
                },
              }}
            >
              <IconButton>
                <HelpOutlineIcon color="primary" fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
          <TableCell align="center">Qty</TableCell>
          <TableCell align="center">Wt/kg</TableCell>
        </TableRow>
        <TableBody>
          {Array.from(tourOrderItems.entries()).map(
            ([article, quantity], idx) => {
              const modelWg =
                solarModules.find((m) => m.name === article)?.weight ?? 1;
              return (
                <TableRow key={idx}>
                  <TableCell align="left">{article}</TableCell>
                  <TableCell align="center">{quantity}</TableCell>
                  <TableCell align="center">
                    {(quantity * modelWg).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            },
          )}

          {/* total */}
          <TableRow key={"total-order-items"}>
            <TableCell align="left" component={"th"}>
              Total
            </TableCell>
            <TableCell align="center" component={"th"}>
              {Array.from(tourOrderItems.values()).reduce(
                (acc, qty) => acc + qty,
                0,
              )}
            </TableCell>
            <TableCell align="center" component={"th"}>
              {Array.from(tourOrderItems.entries())
                .reduce((acc, [article, quantity]) => {
                  const modelWg =
                    solarModules.find((m) => m.name === article)?.weight ?? 1;
                  return acc + quantity * modelWg;
                }, 0)
                .toFixed(2)}
            </TableCell>
          </TableRow>
          {/* ))} */}
        </TableBody>
      </Table>
    </Box>
  );
};

export default SolarPanelQty;
