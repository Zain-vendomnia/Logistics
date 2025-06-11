import React, { useState } from "react";

import {
  Box,
  Fab,
  Stack,
  SwipeableDrawer,
  Tooltip,
  Typography,
} from "@mui/material";
import MultipleStopIcon from "@mui/icons-material/MultipleStop";

import ParkingPetmitRequest from "./ParkingPetmitRequest";
import UploadPermitScreenshot from "./UploadPermitScreenshot";
import ContactSupport from "./ContactSupport";

import StarRating from "../common/Star_Rating";

const DeliveryDrawer = () => {
  const drawerSize = "25vw";

  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <Tooltip title="Side Options">
        <Fab
          onClick={() => {
            setShowDrawer((prev) => !prev);
          }}
          color="primary"
          aria-label="open delivery drawer"
          sx={{
            position: "absolute",
            top: 55,
            right: showDrawer ? drawerSize : "1vw",
            zIndex: 1000,
            transition: "right 0.3s ease-in-out",
            // animation: !isDrawerClicked
            //   ? `${blinkOverlay} 1.5s infinite`
            //   : "none",
          }}
        >
          <MultipleStopIcon
            sx={{
              transform: showDrawer ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.7s",
            }}
          />
        </Fab>
      </Tooltip>

      <SwipeableDrawer
        anchor="right"
        open={showDrawer}
        onOpen={() => {}}
        onClose={() => setShowDrawer((prev) => !prev)}
      >
        <Box
          display="flex"
          flexDirection="column"
          height="100%"
          width={drawerSize}
        >
          <Box
            position="relative"
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="50px"
            bgcolor="primary.main"
          >
            <Typography variant="h5" fontWeight="bold" color="#fff">
              Options
            </Typography>
          </Box>

          <Stack spacing={2} p={2}>
            <ParkingPetmitRequest />
            <UploadPermitScreenshot />

            <StarRating />
          </Stack>

          <Box mt="auto" p={2}>
            <ContactSupport />
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default DeliveryDrawer;
