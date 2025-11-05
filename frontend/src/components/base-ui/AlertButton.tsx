import { IconButton, useTheme, Box } from "@mui/material";
import OfflineBoltIcon from "@mui/icons-material/OfflineBolt";
import { motion } from "framer-motion";

interface Props {
  isActive: boolean;
  onClick: () => void;
}

export default function AlertButton({ isActive, onClick }: Props) {
  const theme = useTheme();

  const pulseAnimation = {
    scale: [1, 1.2, 1],
    opacity: [1, 0.8, 1],
  };

  const glowColor = theme.palette.primary.main;

  return (
    <Box position="relative" display="inline-flex" alignItems="center">
      {isActive && (
        <motion.div
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{
            scale: [1, 1.7, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 1.9,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: 44,
            height: 44,
            borderRadius: "50%",
            backgroundColor: glowColor,
            filter: "blur(6px)",
            zIndex: 0,
          }}
        />
      )}

      <motion.div
        animate={isActive ? pulseAnimation : { scale: 1, opacity: 1 }}
        transition={
          isActive ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : {}
        }
        style={{ zIndex: 1 }}
      >
        <IconButton
          onClick={onClick}
          sx={{
            color: isActive
              ? theme.palette.primary.main
              : theme.palette.action.active,
            transition: "color 0.3s ease, transform 0.1s ease",
            "&:hover": {
              transform: "scale(1.1)",
            },
          }}
        >
          <OfflineBoltIcon sx={{ fontSize: 28 }} />
        </IconButton>
      </motion.div>
    </Box>
  );
}
