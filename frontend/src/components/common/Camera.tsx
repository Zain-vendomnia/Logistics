import { Box, Button, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import CameraIcon from "@mui/icons-material/Camera";
import Webcam from "react-webcam";
import { ImageType, useCameraCapture } from "../../hooks/useCameraCapture";
import { useEffect } from "react";

interface Props {
  type: ImageType;
  mileage?: string;
  buttonText: string;
  isComplied: boolean;
  onImageUploaded: (isDone: boolean) => void;
  onImageSrc?: (imageSrc: string) => void;
}

const Camera = ({
  type,
  mileage,
  buttonText,
  isComplied,
  onImageUploaded,
  onImageSrc,
}: Props) => {
  const {
    webcamRef,
    cameraState,
    updateCameraState,
    handleButtonClick,
    retakeImage,
    clearCamera,
  } = useCameraCapture({ type, mileage });

  useEffect(() => {
    if (!cameraState.captured) return;

    onImageSrc?.(cameraState.captured);
  }, [cameraState.captured]);

  useEffect(() => {
    console.log("isComplied: ", isComplied);
    if (cameraState.uploaded) {
      onImageUploaded(true);

      updateCameraState("active", false);
      updateCameraState("captured", null);
      updateCameraState("uploading", false);
      updateCameraState("uploaded", false);
    }
  }, [cameraState.uploaded]);

  const cameraButtonText = isComplied
    ? "Images Uploaded"
    : cameraState.active
      ? `Take ${buttonText}`
      : cameraState.captured
        ? `Upload ${buttonText}`
        : `Upload ${buttonText}`;

  return (
    <Box
      display="flex"
      height={"100%"}
      alignItems={"center"}
      justifyContent={"center"}
    >
      <Box
        position="relative"
        display={"flex"}
        flexDirection={"column"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={4}
      >
        {/* Camera */}
        <Box
          display={"flex"}
          flexDirection={"column"}
          alignItems={"center"}
          justifyContent={"center"}
          onClick={handleButtonClick}
          sx={{
            border: "3px solid",
            borderColor: "primary.dark",
            borderRadius: 2,
            height: "45vh",
            width: "45vw",
            p: 5,
            "&:hover": { borderColor: "primary.light" },
            "&:active": { borderColor: "primary.dark" },
            "&:focus": { borderColor: "primary.dark" },
          }}
        >
          {!cameraState.active && !cameraState.captured && (
            <IconButton onClick={handleButtonClick} disabled={isComplied}>
              <CameraIcon
                sx={{
                  fontSize: "12rem",
                  opacity: "0.5",
                  "&:hover": { cursor: "pointer" },
                }}
              />
            </IconButton>
          )}

          {cameraState.active && (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              imageSmoothing={true}
              style={{
                width: "45vw",
                height: "45vh",
                objectFit: "cover",
                padding: 0,
                borderRadius: 8,
                // position:
                //   isSmallScreen || isMediumScreen ? "fixed" : "relative",
                // top: isSmallScreen ? 0 : "auto",
                // left: isSmallScreen ? 0 : "auto",
                // zIndex: isSmallScreen || isMediumScreen ? 1000 : "auto",
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
                width: "inherit",
                height: "inherit",
                p: 1,
                borderRadius: 4,
              }}
            />
          )}
        </Box>

        {/* Buttons */}
        <Box
          display="flex"
          alignItems={"center"}
          justifyContent={"center"}
          gap={3}
        >
          <Button
            disabled={isComplied}
            variant="contained"
            sx={{
              //   position: "relative",
              padding: "6px 12px",
              borderRadius: 2,
              width: "16rem",
              minWidth: 180,
              maxWidth: 240,
              height: "4rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 1,
            }}
            onClick={handleButtonClick}
          >
            {cameraState.uploading ? (
              <>
                <CircularProgress size={"3rem"} color="inherit" />
                <Typography sx={{ position: "absolute", opacity: 0.7 }}>
                  Uploading {buttonText}
                </Typography>
              </>
            ) : (
              <Typography>{cameraButtonText}</Typography>
            )}
          </Button>

          {cameraState.captured && !cameraState.uploading && (
            <Button
              variant="outlined"
              sx={{
                //   position: "relative",
                padding: "6px 12px",
                borderRadius: 2,
                width: "16rem",
                minWidth: 180,
                maxWidth: 240,
                height: "4rem",
              }}
              onClick={retakeImage}
            >
              Retake
            </Button>
          )}
        </Box>

        {(cameraState.active || cameraState.captured) && (
          <IconButton
            onClick={clearCamera}
            sx={{
              position: "absolute",
              top: -10,
              right: -42,
              transition: "opacity 0.3s ease",
              zIndex: 1,
            }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

export default Camera;
