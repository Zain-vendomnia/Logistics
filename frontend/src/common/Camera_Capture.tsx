import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import {
  Box,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import { uploadImage } from "../services/trip_Service";
import { useSnackbar } from "../providers/SnackbarProvider";

interface Props {
  buttonText?: string;
  showCameraIcon?: boolean;
  buttonDisabled?: boolean;
  onUpload?: (imageUploaded: boolean) => void;
  isMarkDone?: boolean;
}
const CameraCapture = ({
  buttonText = "Open Camera",
  showCameraIcon = false,
  buttonDisabled,
  onUpload,
  isMarkDone,
}: Props) => {
  const { showSnackbar } = useSnackbar();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("md"));

  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const uploadImageAsync = async (imageSrc: string) => {
    if (!imageSrc) return;

    // temporairy for testing
    onUpload?.(true);
    return;

    console.log("Uploading image initiated...");

    const formData = new FormData();
    formData.append("file", dataURItoBlob(imageSrc), "image.jpg");

    const result = await uploadImage(formData);
    if (result) {
      onUpload?.(true);
      showSnackbar("Image uploaded susseccfully.");
      console.log("Image uploaded successfully:", result);
    } else {
      showSnackbar("Fail to uploading Image, please try again.", "error");
      console.log("Failed to upload image");
    }
  };

  const captureAndUpload = useCallback(() => {
    setIsCapturing(true);
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      console.log("Image Src: ", imageSrc);

      if (imageSrc) {
        setCapturedImage(imageSrc);
      }

      setIsCapturing(false);
    }, 1000);
  }, []);

  const getWebcamSize = () => {
    if (isSmallScreen || isMediumScreen) {
      return {
        width: "100vw",
        height: "100vh",
      };
    } else {
      return {
        width: "80%",
        height: "auto",
      };
    }
  };

  const webcamSize = getWebcamSize();

  return (
    <Box display="flex" flexDirection="column" alignItems="center" p={0}>
      {isMarkDone ? (
        // if Image uploaded already
        <Button disabled={isMarkDone} size="large">
          <CheckCircleIcon sx={{ fontSize: 56, color: "#4caf50" }} />
        </Button>
      ) : (
        <>
          {cameraActive && !capturedImage && (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              imageSmoothing={true}
              style={{
                width: webcamSize.width,
                height: webcamSize.height,
                objectFit: "cover",
                position:
                  isSmallScreen || isMediumScreen ? "fixed" : "relative",
                top: 0,
                left: 0,
                zIndex: isSmallScreen || isMediumScreen ? 1000 : "auto",
              }}
              videoConstraints={{
                width: 1280,
                height: 720,
                // facingMode: { exact: "environment" }
              }}
            />
          )}
          {capturedImage && (
            <Box
              component="img"
              src={capturedImage}
              alt="captured image"
              sx={{
                width: "100%",
                height: "auto",
              }}
            />
          )}
          {showCameraIcon && !cameraActive && (
            <IconButton
              onClick={() => setCameraActive(true)}
              sx={styles.iconButton}
            >
              <AddAPhotoIcon fontSize="large" />
            </IconButton>
          )}

          {buttonText && (
            <Button
              disabled={buttonDisabled}
              size="small"
              variant="contained"
              sx={styles.button}
              onClick={() => {
                if (cameraActive && !capturedImage) {
                  captureAndUpload();
                } else if (capturedImage) {
                  uploadImageAsync(capturedImage);
                } else {
                  setCameraActive(true);
                }
              }}
            >
              {/* {isCapturing ? "Capturing..." : buttonText} */}
              {cameraActive
                ? capturedImage
                  ? "Uplaod Image"
                  : isCapturing
                    ? "Capturing..."
                    : "Capture Image"
                : buttonText}
            </Button>
          )}
        </>
      )}
    </Box>
  );
};

export default CameraCapture;

const styles = {
  iconButton: {
    width: 120,
    height: 120,
    border: "2px dashed",
    borderRadius: "8px",
    "&:focus": {
      backgroundColor: "grey.200",
    },
    "&:active": {
      backgroundColor: "grey.200",
    },
    "&:hover": {
      backgroundColor: "grey.200",
    },
  },
  button: {
    width: "auto",
    height: "48px",
    my: 3,
    minWidth: 120,
    "&:active": {
      backgroundColor: "primary.dark", // Visual feedback on tap
    },
  },
};

const dataURItoBlob = (dataURI: string) => {
  const byteString = atob(dataURI.split(",")[1]);
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  console.log("Image Blob: ", new Blob([ab], { type: mimeString }));
  return new Blob([ab], { type: mimeString });
};
