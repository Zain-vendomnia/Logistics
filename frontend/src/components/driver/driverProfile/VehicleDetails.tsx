import React from "react";

import { alpha, Box, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";

const VehicleDetails = () => {
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
          Vehicle `AHG-007`
        </Typography>
      </Box>
      <Box mt={"auto"}>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          px={0.5}
        >
          <Typography>Millage Driven: </Typography>
          <Typography>845761 kms</Typography>
        </Box>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-Between"}
          //   bgcolor={grey[300]}
          bgcolor={(theme) => alpha(theme.palette.primary.main, 0.5)}
          px={0.5}
        >
          <Typography>Next Service: </Typography>
          <Typography>1045 kms</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default VehicleDetails;
