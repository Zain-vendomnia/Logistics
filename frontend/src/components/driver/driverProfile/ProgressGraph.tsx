import React, { useState } from "react";

import { Box, IconButton, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { HighlightScope } from "@mui/x-charts/context";

const xAxisData = [
  "2025-06-01",
  "2025-06-02",
  "2025-06-03",
  "2025-06-04",
  "2025-06-05",
  "2025-06-06",
  "2025-06-07",
  "2025-06-08",
];

const barChartsParams = {
  series: [
    { data: [3, 4, 1, 6, 5, 7, 5, 2], label: "Successful Delivery" },
    { data: [4, 3, 1, 5, 8, 6, 3, 8], label: "Timely Reports" },
    { data: [4, 2, 5, 4, 1, 3, 4, 6], label: "Route ", color: "#edc06b" },
  ],
  xAxis: [
    {
      data: xAxisData,
      scaleType: "band" as const, // for categories, use "time" for Date objects
      valueFormatter: (value: string) =>
        new Date(value).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }), // e.g. "01 Jun"
    },
  ],
  height: 350,
};

const ProgressGraph = () => {
  const [highlight, setHighlight] = useState("item");
  const [fade, setFade] = useState("global");

  return (
    <Box display={"flex"} flexDirection={"column"} width={"100%"} height="100%">
      <Box
        display={"flex"}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Typography variant="body2">Progress Graph</Typography>
        <IconButton>
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Box>

      <BarChart
        {...barChartsParams}
        series={barChartsParams.series.map((series) => ({
          ...series,
          highlightScope: {
            highlight,
            fade,
          } as HighlightScope,
        }))}
        sx={{ mt: "auto" }}
      />
    </Box>
  );
};

export default ProgressGraph;
