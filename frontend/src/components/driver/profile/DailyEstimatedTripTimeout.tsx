import React from "react";

import { alpha, Box, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import CircularProgress from "@mui/material/CircularProgress";

import { useEstimatedTripTime } from "../../../hooks/driver_Profile/useEstimatedTripTime";
import { formatTime_hrs } from "../../../utils/formatConverter";

const DailyEstimatedTripTimeout = () => {
  const { data, loading, error } = useEstimatedTripTime();

  if (loading) {
    return (
      <Box
        height="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={2}
      >
        <CircularProgress color="inherit" size={32} />
      </Box>
    );
  }

  // 🔴 Error UI
  if (error || !data) {
    return (
      <Box
        height="100%"
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={2}
      >
        <Typography color="error" textAlign="center">
          {error ?? "Data unavailable"}
        </Typography>
      </Box>
    );
  }

  return (
    <Box display={"flex"} flexDirection={"column"} height={"100%"}>
      <Box
        display={"flex"}
        alignItems="center"
        justifyContent={"space-between"}
      >
        <Box
          sx={{
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.5),
            // bgcolor: grey[200],
            color: grey[900],
            p: 1,
            borderRadius: "50%",
          }}
        >
          <AllInclusiveIcon />
        </Box>
        <Typography variant="h5" fontWeight={"bold"} fontSize={"large"}>
          Esitmated Time
        </Typography>
      </Box>
      <Box mt={"auto"}>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          px={0.5}
        >
          <Typography>Consumed Time: </Typography>
          <Typography>{formatTime_hrs(data?.consumedTime_MS)} hrs</Typography>
        </Box>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-Between"}
          //   bgcolor={grey[300]}
          bgcolor={(theme) => alpha(theme.palette.primary.main, 0.5)}
          px={0.5}
        >
          <Typography>Estimated Time: </Typography>
          <Typography>{formatTime_hrs(data?.estimatedTime_MS)} hrs</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DailyEstimatedTripTimeout;
