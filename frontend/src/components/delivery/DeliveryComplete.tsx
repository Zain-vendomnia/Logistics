import React, { useState } from "react";

import { Box, Paper, Typography } from "@mui/material";
import { ModalWrapper } from "../common/ModalWrapper";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

const DeliveryComplete = () => {
  const [showModal, setShowModal] = useState(true);
  return (
    <ModalWrapper
      open={showModal}
      title="Delivery Completed"
      onClose={() => {
        setShowModal(false);
      }}
    >
      <Box
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        gap={6}
        sx={{ width: "100%", height: "100%" }}
      >
        <TaskAltIcon color="success" sx={{ height: "86px", width: "86px" }} />
        <Paper elevation={4} sx={{ p: 2, width: "80%" }}>
          <Box display={"flex"} justifyContent={"space-between"}>
            <Typography fontWeight={"bold"} fontSize={"1.5rem"}>
              Consumed Time:
            </Typography>
            <Typography fontWeight={"bold"} fontSize={"1.5rem"}>
              35 min
            </Typography>
          </Box>
          <Box display={"flex"} justifyContent={"space-between"}>
            <Typography fontWeight={"bold"} fontSize={"1.5rem"}>
              Expected Delivery Time:
            </Typography>
            <Typography fontWeight={"bold"} fontSize={"1.5rem"}>
              40 min
            </Typography>
          </Box>
        </Paper>
      </Box>
    </ModalWrapper>
  );
};

export default DeliveryComplete;
