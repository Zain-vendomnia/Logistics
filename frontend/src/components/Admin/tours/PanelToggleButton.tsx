import { Box, IconButton } from "@mui/material";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

const PanelToggleButton = ({
  expanded,
  onClick,
}: {
  expanded: boolean;
  onClick: () => void;
}) => (
  <Box position="relative" width={"100%"}>
    <IconButton
      onClick={onClick}
      sx={{
        position: "absolute",
        // top: "50%",
        top: 10,
        right: -15,
        transform: "translateY(-50%)",
        bgcolor: "#999",
        border: "1px solid #ccc",
        borderRadius: "6px",
        height: "32px",
        width: "20px",
        p: 0,
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
