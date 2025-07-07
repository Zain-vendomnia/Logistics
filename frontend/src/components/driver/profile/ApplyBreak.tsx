import { alpha, Box, styled, Switch, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import FreeBreakfastIcon from "@mui/icons-material/FreeBreakfast";

import { useDriverBreakStore } from "../../../store/useDriverBreakStore";
import { formatTime } from "../../../utils/formatConverter";
import { BreakTimer } from "../BreakTimer";

const StyledSwitch = styled(Switch)(({ theme }) => ({
  padding: 8,
  "& .MuiSwitch-track": {
    borderRadius: 22 / 2,
    "&::before, &::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: 16,
      height: 16,
    },
    "&::before": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.success.dark)
      )}" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/></svg>')`,
      left: 12,
    },
    "&::after": {
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        theme.palette.getContrastText(theme.palette.success.main)
      )}" d="M19,13H5V11H19V13Z" /></svg>')`,
      right: 12,
    },
  },
  "& .MuiSwitch-thumb": {
    boxShadow: "none",
    width: 16,
    height: 16,
    margin: 2,
  },
}));

const ApplyBreak = () => {
  const {
    isBreakCancelled,
    isBreakEligible,
    isBreakActive,
    breakElapsed,
    handleToggleBreak,
    BREAK_LIMIT,
  } = useDriverBreakStore();

  const disableButton =
    isBreakCancelled || !isBreakEligible || breakElapsed >= BREAK_LIMIT;

  return (
    <Box display={"flex"} flexDirection={"column"} height={"100%"}>
      {isBreakActive && <BreakTimer />}

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
          <FreeBreakfastIcon />
        </Box>
        <Typography variant="h5" fontWeight={"bold"} fontSize={"large"}>
          Apply Break
        </Typography>
      </Box>
      <Box mt={"auto"}>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-between"}
          px={0.5}
        >
          <Box display={"flex"} justifyContent={"flex-start"} gap={1}>
            <Typography>Utilized: </Typography>
            <Typography>{formatTime(breakElapsed)} </Typography>
          </Box>

          <StyledSwitch
            checked={isBreakActive}
            onChange={handleToggleBreak}
            disabled={disableButton}
          />
        </Box>
        <Box
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-Between"}
          bgcolor={(theme) => alpha(theme.palette.primary.main, 0.5)}
          // bgcolor={grey[300]}
          px={0.5}
        >
          <Typography>Time Allowed: </Typography>
          <Typography>{formatTime(BREAK_LIMIT)}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default ApplyBreak;
