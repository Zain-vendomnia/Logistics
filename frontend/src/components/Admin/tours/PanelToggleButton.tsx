import { Box, IconButton, SxProps } from "@mui/material";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

const PanelToggleButton = ({
  expanded,
  onClick,
  sx,
}: {
  expanded: boolean;
  onClick: () => void;
  sx?: SxProps;
}) => (
  <Box position="relative">
    <IconButton
      onClick={onClick}
      sx={{
        // position: "absolute",
        // top: "50%",
        // top: 7,
        // right: 0,
        // p: 0,
        // transform: "translateY(-50%)",
        bgcolor: "#9c9c9c",
        border: "1px solid #ccc",
        borderRadius: "6px",
        height: "32px",
        width: "20px",
        ...sx,
      }}
    >
      {expanded ? (
        <ArrowLeftIcon fontSize="small" />
      ) : (
        <ArrowRightIcon fontSize="small" />
      )}
    </IconButton>
  </Box>
);

export default PanelToggleButton;
