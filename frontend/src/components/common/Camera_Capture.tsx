import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import Webcam from "react-webcam";
import { debounce, delay } from "lodash";

import {
  Box,
  Button,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";

import { uploadImage } from "../../services/trip_Service";
import { useSnackbar } from "../../providers/SnackbarProvider";

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
  const lastUploadedImageRef = useRef<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [imageCaptured, setImageCaptured] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isUploaded, setIsUploaded] = useState<boolean>(false);

  const webcamSize = useMemo(
    () => ({
      width: isSmallScreen || isMediumScreen ? "100vw" : "80%",
      height: isSmallScreen || isMediumScreen ? "100vh" : "auto",
    }),
    [isSmallScreen, isMediumScreen]
  );

  const uploadImageAsync = async (imageSrc: string) => {
    if (!imageSrc || imageSrc === lastUploadedImageRef.current) return;

    lastUploadedImageRef.current = imageSrc;
    setIsUploading(true);

    // for temporary testing
    setTimeout(() => {
      setIsUploaded(true);
      // setIsUploading(false);
    }, 1000);

    // try {
    //   const formData = new FormData();
    //   formData.append("file", dataURItoBlob(imageSrc), "image.jpg");

    //   const result = await uploadImage(formData);
    //   if (result) {
    //     setIsUploaded(true);
    //     onUpload?.(true);
    //     showSnackbar("Image uploaded successfully.");
    //   } else {
    //     throw new Error("Upload failed");
    //   }
    // } catch (error) {
    //   showSnackbar("Failed to upload image, please try again.", "error");
    // } finally {
    //   setIsUploading(false);
    // }
  };

  const debouncedUpload = useMemo(
    () =>
      debounce(async (capturedImage: string) => {
        await uploadImageAsync(capturedImage);
      }, 1000),
    []
  );

  const captureAndUpload = useCallback(() => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current?.getScreenshot();
    console.log("Image Src: ", imageSrc);
    if (imageSrc) {
      setImageCaptured(imageSrc);
    }
  }, []);

  useEffect(() => {
    if (isUploaded) {
      delay(() => {
        onUpload?.(true);
      }, 2000);
    }
  }, [isUploaded]);

  useEffect(() => {
    return () => {
      debouncedUpload.cancel();
    };
  }, [debouncedUpload]);

  function handleButtonClick(): void {
    if (cameraActive && !imageCaptured) {
      captureAndUpload();
    } else if (imageCaptured) {
      debouncedUpload(imageCaptured);
    } else {
      setCameraActive(true);
    }
  }

  const retakeImage = () => setImageCaptured(null);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={2}
    >
      {isMarkDone && !imageCaptured ? (
        <CheckCircleIcon
          color={"success"}
          sx={{ fontSize: 48, margin: 0, padding: 0 }}
        />
      ) : isUploaded && imageCaptured ? (
        // if marked done and image captured, show image and check icon
        <>
          <Box
            component={"img"}
            src={imageCaptured}
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
          {cameraActive && !imageCaptured && (
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
          {imageCaptured && (
            <Box
              component="img"
              src={imageCaptured}
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
          <Box display="flex" gap={1}>
            <Button
              disabled={buttonDisabled}
              variant="contained"
              sx={styles.button}
              onClick={handleButtonClick}
            >
              {cameraActive
                ? imageCaptured
                  ? isUploading
                    ? "Uploading..."
                    : "Upload"
                  : "Capture"
                : buttonText}
            </Button>
            {imageCaptured && !isUploading && (
              <Button
                variant="outlined"
                sx={styles.button}
                onClick={retakeImage}
              >
                Retake
              </Button>
            )}
          </Box>
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
    minWidth: 60,
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
