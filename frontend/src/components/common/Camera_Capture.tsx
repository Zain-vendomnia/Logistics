import { useMemo, ReactNode, useEffect } from "react";
import Webcam from "react-webcam";

import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import CircularProgress from "@mui/material/CircularProgress";

// import { uploadImage } from "../../services/trip_Service";
import { uploadImage } from "../../utils/upload_Image";
import { ImageType, useCameraCapture } from "../../hooks/useCameraCapture";

interface Props {
  styleCard?: boolean;
  title?: ReactNode;
  description?: string;

  buttonText?: string;
  showCameraIcon?: boolean;
  buttonDisabled?: boolean;
  onComplete?: (imageUploaded: boolean) => void;
  onImageUploaded?: (imageSrc: string) => void;
  isMarkDone?: boolean;

  imageType: ImageType;
  mileage?: string;
}
const CameraCapture = ({
  styleCard = true,
  title = "",
  description = "",
  buttonText = "Open Camera",
  showCameraIcon = false,
  buttonDisabled,
  onComplete,
  onImageUploaded,
  isMarkDone,
  imageType,
  mileage,
}: Props) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isMediumScreen = useMediaQuery(theme.breakpoints.between("sm", "md"));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up("md"));

  const webcamSize = useMemo(
    () => ({
      width: isSmallScreen || isMediumScreen ? "100vw" : "100%",
      height: isSmallScreen || isMediumScreen ? "100vh" : "auto",
    }),
    [isSmallScreen, isMediumScreen]
  );

  const {
    webcamRef,
    cameraState,
    updateCameraState,
    handleButtonClick,
    retakeImage,
  } = useCameraCapture({ type: imageType, mileage, onComplete });

  const isInitialState =
    showCameraIcon &&
    !cameraState.active &&
    !cameraState.captured &&
    !cameraState.uploading &&
    !cameraState.uploaded;

  useEffect(() => {
    if (cameraState.uploaded && cameraState.captured) {
      onImageUploaded?.(cameraState.captured);
    }
  }, [cameraState.uploaded, onImageUploaded]);

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"center"}
      alignItems={"center"}
      gap={2}
      height={"100%"}
      width={"100%"}
      sx={styleCard ? styles.container : undefined}
    >
      {title && (
        <Stack spacing={0} width={"100%"}>
          <Typography variant="h5" fontWeight="bold">
            {title}
          </Typography>
          <Typography variant="body1" fontSize={"1.1rem"}>
            {description}
          </Typography>
        </Stack>
      )}

      <Box
        mt={"auto"}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={3}
      >
        {isMarkDone && !cameraState.captured ? (
          <CheckCircleIcon
            color={"success"}
            sx={{ fontSize: 48, margin: 0, padding: 0 }}
          />
        ) : cameraState.uploaded && cameraState.captured ? (
          // if marked done and image captured, show image and check icon
          <Stack spacing={2} alignItems={"center"} justifyContent={"center"}>
            <Box
              component={"img"}
              src={cameraState.captured}
              alt="captured image"
              sx={{
                width: "auto",
                height: "70%",
              }}
            />
            <CheckCircleIcon
              color={"success"}
              sx={{ fontSize: 48, margin: 0, padding: 0 }}
            />
          </Stack>
        ) : (
          <>
            {cameraState.active && !cameraState.captured && (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                imageSmoothing={true}
                style={{
                  width: webcamSize.width,
                  height: webcamSize.height,
                  borderRadius: "6px",
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
            {cameraState.captured && (
              <Box
                component="img"
                src={cameraState.captured}
                alt="captured image"
                sx={{
                  width: "auto",
                  height: "50%",
                  borderRadius: "6px",
                }}
              />
            )}
            {isInitialState && (
              <IconButton
                onClick={() => updateCameraState("active", true)}
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
                {cameraState.uploading ? (
                  <>
                    <CircularProgress size={"2rem"} color="inherit" />
                    <Typography sx={{ position: "absolute", opacity: 0.7 }}>
                      Uploading
                    </Typography>
                  </>
                ) : cameraState.active ? (
                  "Capture Image"
                ) : cameraState.captured ? (
                  "Upload"
                ) : (
                  buttonText
                )}
              </Button>
              {cameraState.captured && !cameraState.uploading && (
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
    </Box>
  );
};

export default CameraCapture;

const styles = {
  container: {
    p: 2,
    borderWidth: "2px",
    borderStyle: "solid",
    borderColor: "primary.main",
    borderRadius: 2,
  },
  iconButton: {
    // mt: "5vh",
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
    minWidth: 110,
    height: 3,
    minHeight: "48px",
    "&:active": {
      backgroundColor: "primary.dark", // Visual feedback on tap
    },
  },
};
