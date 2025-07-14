import { Box, Button, Stack, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { formatTime_ms } from "../../utils/formatConverter";
import { useDriverBreakStore } from "../../store/useDriverBreakStore";
import { ModalWrapper } from "../common/ModalWrapper";

const radius = 120;
const stroke = 12;
const normalizedRadius = radius - stroke * 0.5;
const circumference = normalizedRadius * 2 * Math.PI;

export const BreakTimer = () => {
  const { breakElapsed, BREAK_LIMIT, handleCancelBreak } =
    useDriverBreakStore();

  const percentage = Math.min(breakElapsed / BREAK_LIMIT, 1);
  const progress = circumference - percentage * circumference;
  const controls = useAnimation();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    controls.start({ strokeDashoffset: progress });
  }, [progress]);

  const handleFinishBreak = () => {
    handleCancelBreak();
    setShowModal(false);
  };

  return (
    <>
      <Box
        position="absolute"
        top={150}
        right={10}
        display="flex"
        sx={{ zIndex: !showModal ? 1500 : "auto" }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          border="2px solid"
          borderColor={grey[300]}
          borderRadius={4}
          bgcolor={grey[100]}
          p={3}
          px={7}
          gap={2}
        >
          <Typography fontWeight="bold">Break Timer</Typography>

          <Box position="relative" width={radius * 2} height={radius * 2}>
            <svg width={radius * 2} height={radius * 2}>
              <circle
                cx={radius}
                cy={radius}
                r={normalizedRadius}
                stroke={grey[300]}
                strokeWidth={stroke}
                fill="none"
              />
              <motion.circle
                cx={radius}
                cy={radius}
                r={normalizedRadius}
                stroke="green"
                strokeWidth={stroke}
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                strokeLinecap="round"
                fill="none"
                animate={controls}
                initial={{ strokeDashoffset: circumference }}
              />
            </svg>

            <Box
              position="absolute"
              top="50%"
              left="50%"
              sx={{ transform: "translate(-50%, -50%)" }}
            >
              <Typography variant="h5" fontWeight="bold">
                {formatTime_ms(breakElapsed)}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={() => setShowModal(true)}
            color={"error"}
          >
            Finish Break
          </Button>
        </Box>
      </Box>

      {showModal && (
        <ModalWrapper
          title={"Abort Break!"}
          open={showModal}
          onClose={() => setShowModal(false)}
        >
          <Stack spacing={6} mx={4}>
            <Box
              display={"flex"}
              gap={2}
              flexDirection={"column"}
              justifyContent={"flex-start"}
            >
              <Typography variant="h4" fontWeight={"bold"}>
                Finish Your Break?
              </Typography>
              <Typography variant={"body1"}>
                You will not be able to resume Break later.
              </Typography>
            </Box>
            <Box
              display={"flex"}
              gap={2}
              justifyContent={"center"}
              width={"100%"}
            >
              <Button
                variant="contained"
                onClick={handleFinishBreak}
                color="error"
              >
                Finish Break
              </Button>
              <Button variant="contained" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
            </Box>
          </Stack>
        </ModalWrapper>
      )}
    </>
  );
};
