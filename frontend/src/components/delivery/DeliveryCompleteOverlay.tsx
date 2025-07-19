import { Backdrop, Box } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { motion, AnimatePresence } from "framer-motion";
import { useDeliveryStore } from "../../store/useDeliveryStore";

const DeliveryCompleteOverlay = () => {
  const deliveryCompleted = useDeliveryStore((s) => s.deliveryCompleted);
  const tripData = useDeliveryStore((s) => s.tripData);

  return (
    <AnimatePresence>
      {deliveryCompleted && (
        <Backdrop
          open
          sx={{
            zIndex: (theme) => theme.zIndex.modal + 1,
            color: "#fff",
            backdropFilter: "blur(2px)",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
          >
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              height="100vh"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.2 }}
                exit={{ scale: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircleIcon sx={{ fontSize: 120, color: "green" }} />
              </motion.div>
            </Box>
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>
  );
};

export default DeliveryCompleteOverlay;
