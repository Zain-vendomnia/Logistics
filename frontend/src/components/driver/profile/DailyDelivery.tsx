import React from "react";

import { alpha, Box, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import { useDailyDelivery } from "../../../hooks/driver_Profile/useDailyDelivery";

const DailyDelivery = () => {
  const { data, loading, error } = useDailyDelivery();

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
          Daily Deliveries
        </Typography>
      </Box>
      <Box mt={"auto"}>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          px={0.5}
        >
          <Typography>Completed: </Typography>
          <Typography>{data?.completed}</Typography>
        </Box>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-Between"}
          bgcolor={(theme) => alpha(theme.palette.primary.main, 0.5)}
          // bgcolor={grey[300]}
          px={0.5}
        >
          <Typography>Due Deliveries: </Typography>
          <Typography>{data?.due}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default DailyDelivery;
