import { alpha, Box, Stack, useTheme } from "@mui/material";
import { grey } from "@mui/material/colors";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";

import DriverProfileDetails from "./profile/DriverProfileDetails";
import ProgressGraph from "./profile/ProgressGraph";
import ApplyBreak from "./profile/ApplyBreak";
import DailyDelivery from "./profile/DailyDelivery";
import TotalDeliveries from "./profile/TotalDeliveries";
import DailyEstimatedTripTimeout from "./profile/DailyEstimatedTripTimeout";
import VehicleDetails from "./profile/VehicleDetails";

const style = {
  box_layout: {
    bgcolor: grey[200],
    border: "2px solid",
    borderColor: grey[500],
    borderRadius: 4,
    p: 2,
  },
};

const DriverProfile = () => {
  const space = 1;
  const theme = useTheme();

  return (
    <>
      <Box
        display="flex"
        gap={space}
        overflow={"hidden"}
        bgcolor={grey[200]}
        p={1}
        height={"100%"}
      >
        <Stack
          spacing={space}
          sx={{
            ...style.box_layout,
            bgcolor: alpha(theme.palette.primary.main, 0.7),
            // bgcolor: alpha(theme.palette.primary.light, 0.7),
            width: { xs: "20%", md: "25%", lg: "25%" },
            // width: { xs: "25%", md: "27%", lg: "30%" },
          }}
        >
          <DriverProfileDetails />
        </Stack>

        {/* Content Section */}
        <Box
          display={"flex"}
          flexDirection={"column"}
          width={{ xs: "80%", md: "75%", lg: "75%" }}
          height={"100%"}
          gap={space}
        >
          {/* Options */}
          <Stack spacing={space}>
            <Box
              display={"flex"}
              alignItems={"center"}
              justifyContent={"space-between"}
              gap={space}
            >
              <Box
                width={"50%"}
                height={150}
                sx={{ ...style.box_layout, bgcolor: "white" }}
              >
                <DailyDelivery />
              </Box>
              <Box
                width={"50%"}
                height={150}
                sx={{ ...style.box_layout, bgcolor: "white" }}
              >
                <DailyEstimatedTripTimeout />
              </Box>
              <Box
                width={"50%"}
                height={150}
                sx={{ ...style.box_layout, bgcolor: "white" }}
              >
                <ApplyBreak />
              </Box>
            </Box>
            <Box
              display={"flex"}
              alignItems={"center"}
              justifyContent={"space-between"}
              gap={space}
            >
              <Box
                width={"50%"}
                height={150}
                sx={{ ...style.box_layout, bgcolor: "white" }}
              >
                <TotalDeliveries />
              </Box>
              <Box
                width={"50%"}
                height={150}
                sx={{ ...style.box_layout, bgcolor: "white" }}
              >
                <VehicleDetails />
              </Box>
              <Box
                width={"50%"}
                height={150}
                sx={{ ...style.box_layout, bgcolor: "white" }}
              >
                <Box display={"flex"} alignItems={"flex-start"}>
                  <Box
                    sx={{
                      bgcolor: grey[200],
                      color: grey[900],
                      p: 1,
                      borderRadius: "50%",
                    }}
                  >
                    <AllInclusiveIcon />
                  </Box>
                </Box>
              </Box>
            </Box>
          </Stack>

          {/* Graph */}
          <Box flexGrow={1}>
            <Box sx={{ ...style.box_layout, bgcolor: "white", height: "100%" }}>
              <ProgressGraph />
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default DriverProfile;
