import { useEffect, useState } from "react";
import { Fab, IconButton, Slide, Snackbar } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ClearAllIcon from "@mui/icons-material/ClearAll";

import { useDeliveryStore } from "../../store/useDeliveryStore";
import { resetDeliveryStore } from "../../utils/resetDeliveryStore";
import { useDriverBreakStore } from "../../store/useDriverBreakStore";
import { useTripLifecycle } from "../../hooks/useTripLifecycle";

const Dev_Helper = () => {
  const store = useDeliveryStore();
  const { resetBreakState } = useDriverBreakStore();

  const { isDeliveryStarted } = useTripLifecycle();

  const [showActiveDeliveryScenario, setShowActiveDeliveryScenario] =
    useState(true);

  useEffect(() => {
    setShowActiveDeliveryScenario(true);
  }, [store.scenarioKey, showActiveDeliveryScenario]);

  const slideTransition = (props: any) => {
    return <Slide {...props} direction="left" />;
  };

  const snackbarAction = (
    <IconButton onClick={() => setShowActiveDeliveryScenario(false)}>
      <CloseIcon style={{ color: "#fff" }} />
    </IconButton>
  );

  return (
    <>
      {showActiveDeliveryScenario && (
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={true}
          message={store.scenarioKey}
          slots={{ transition: slideTransition }}
          action={snackbarAction}
          sx={{ marginTop: 4 }}
          slotProps={{
            content: {
              sx: {
                bgcolor: "secondary.main",
                color: "white",
                mt: 0,
              },
            },
          }}
        />
      )}
      <Fab
        onClick={() => {
          resetDeliveryStore();
          resetBreakState();
        }}
        color="primary"
        aria-label="open delivery drawer"
        sx={{
          position: "absolute",
          bottom: 10,
          right: 8,
          zIndex: 1500,
        }}
      >
        <ClearAllIcon
          sx={{
            transform: isDeliveryStarted ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.7s",
          }}
        />
      </Fab>
    </>
  );
};

export default Dev_Helper;
