import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import {
  Box,
  Button,
  IconButton,
  Stack,
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
    }, 100);
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
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      {isMarkDone && !capturedImage ? (
        // if marked done and image ref not available, show check icon only
        <CheckCircleIcon
          color={"success"}
          sx={{ fontSize: 48, margin: 0, padding: 0 }}
        />
      ) : isMarkDone && capturedImage ? (
        // if marked done and image captured, show image and check icon
        <>
          <Box
            component={"img"}
            src={capturedImage}
            alt="captured image"
            sx={{
              width: "auto",
              height: "50%",
            }}
          />
          <CheckCircleIcon
            color={"success"}
            sx={{ fontSize: 48, margin: 0, padding: 0 }}
          />
        </>
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
                top: isSmallScreen ? 0 : "auto",
                left: isSmallScreen ? 0 : "auto",
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
                width: "auto",
                height: "50%",
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
    minWidth: 120,
    minHeight: "48px",
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
