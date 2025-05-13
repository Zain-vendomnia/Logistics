import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useSnackbar } from "./SnackbarProvider";
import IUser, { isDriver } from "../types/user.type";

interface GlobalChecksContextType {
  locationEnabled: boolean;
  cameraEnabled: boolean;
}

const GlobalChecksContext = createContext<GlobalChecksContextType>({
  locationEnabled: false,
  cameraEnabled: false,
});

export const useGlobalChecks = () => useContext(GlobalChecksContext);

const GlobalChecksProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { showSnackbar } = useSnackbar();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [openLocationDialog, setOpenLocationDialog] = useState(false);
  const [openCameraDialog, setOpenCameraDialog] = useState(false);

  const checkLocationPermission = useCallback(async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "geolocation",
      });
      if (permissionStatus.state === "granted") {
        setLocationEnabled(true);
        localStorage.setItem("locationEnabled", "true");
      } else {
        checkLocation();
      }
    } catch (error) {
      checkLocation();
    }
  }, []);

  const checkLocation = () => {
    if (!navigator.geolocation) {
      showSnackbar("Geolocation is not supported by your browser");
      return;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          localStorage.setItem("locationEnabled", "true");
          showSnackbar("GPS is enabled");
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setOpenLocationDialog(true);
          }
        }
      );
      setOpenLocationDialog(true);
    }
  };

  const enableLocation = () => {
    if (!navigator.geolocation) {
      showSnackbar("Geolocation is not supported by your browser");
      return;
    }
    const checkPermissionAndLocation = () => {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((permissionStatus) => {
          if (
            permissionStatus.state === "granted" ||
            permissionStatus.state === "prompt"
          ) {
            navigator.geolocation.getCurrentPosition(
              () => {
                setLocationEnabled(true);
                setOpenLocationDialog(false);
                localStorage.setItem("locationEnabled", "true");
                showSnackbar("GPS is enabled");
              },
              () => {
                setOpenLocationDialog(true);
              }
            );
          } else {
            showSnackbar(
              "Location access is blocked. Enable it in browser settings.",
              "error"
            );
            setOpenLocationDialog(true);
          }
        });
    };
    checkPermissionAndLocation();
  };

  const checkCameraPermission = useCallback(async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      if (permissionStatus.state === "granted") {
        setCameraEnabled(true);
        localStorage.setItem("cameraEnabled", "true");
      } else {
        checkCamera();
      }
    } catch (error) {
      checkCamera();
    }
  }, []);

  const checkCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraEnabled(true);
      setOpenCameraDialog(false);
      showSnackbar("Camera is functional");
      stream.getTracks().forEach((track) => track.stop());
      localStorage.setItem("cameraEnabled", "true");
    } catch (error) {
      setOpenCameraDialog(true);

      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          showSnackbar(
            "Camera access denied. Please enable permissions.",
            "error"
          );
        } else if (error.name === "NotFoundError") {
          showSnackbar(
            "No camera detected. Please check your device.",
            "error"
          );
        } else if (error.name === "NotReadableError") {
          showSnackbar("Camera is in use or unavailable.", "error");
        } else {
          showSnackbar(`Camera error: ${error.message}`, "error");
        }
      } else {
        showSnackbar("Camera is Not functional", "error");
      }
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user: IUser = JSON.parse(userData);
      if (isDriver(user)) {
        checkLocationPermission();
        checkCameraPermission();
      }
    }
  }, [checkLocationPermission, checkCameraPermission]);

  return (
    <GlobalChecksContext.Provider value={{ locationEnabled, cameraEnabled }}>
      {children}

      {/* Location and Camera Dialogs */}
      {!locationEnabled && (
        <Dialog open={openLocationDialog}>
          <DialogTitle>Enable GPS</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enable GPS to continue.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={enableLocation} color="primary" autoFocus>
              Enable GPS
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {!cameraEnabled && (
        <Dialog open={openCameraDialog}>
          <DialogTitle>Camara Not Functional!</DialogTitle>
          <DialogContent>
            <DialogContentText>
              The camera is not detected. Please check your camera settings.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button color="primary" autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </GlobalChecksContext.Provider>
  );
};

export default GlobalChecksProvider;
