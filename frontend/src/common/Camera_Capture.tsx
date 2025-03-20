import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Box, Button, IconButton } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";

interface Props {
  buttonText?: string;
  showCameraIcon?: boolean;
  buttonDisabled?: boolean;
  onUpload?: (imageUploaded: boolean) => void;
  isMarkDone?: boolean;
}
const CameraCapture = ({
  buttonText = undefined,
  showCameraIcon = false,
  buttonDisabled,
  onUpload,
  isMarkDone,
}: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const uploadImageAsync = async (imageSrc: string) => {
    if (!imageSrc) return;
    try {
      console.log("Uploading image initiated...");

      const formData = new FormData();
      formData.append("file", dataURItoBlob(imageSrc), "image.jpg");

      const response = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Image uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const captureAndUpload = useCallback(() => {
    setIsCapturing(true);
    setTimeout(() => {
      const imageSrc = webcamRef.current?.getScreenshot();
      console.log("Image Uploaded: ", imageSrc);
      // onUpload && onUpload(true);
      onUpload?.(true);

      if (imageSrc) {
        uploadImageAsync(imageSrc);
      }
      setIsCapturing(false);
    }, 1000);
  }, []);

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    console.log("blob: ", new Blob([ab], { type: mimeString }));
    return new Blob([ab], { type: mimeString });
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" p={0}>
      {isCapturing && (
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          style={{ width: 10, height: 10, display: "none" }}
        />
      )}

      {isMarkDone ? (
        // if Image uploaded already
        <Button disabled={isMarkDone} size="large">
          <CheckCircleIcon sx={{ fontSize: 42, color: "#4caf50" }} />
        </Button>
      ) : (
        <>
          {showCameraIcon && (
            <IconButton onClick={captureAndUpload} sx={styles.iconButton}>
              <AddAPhotoIcon fontSize="large" />
            </IconButton>
          )}
          {buttonText && (
            <Button
              disabled={buttonDisabled}
              size="small"
              variant="contained"
              sx={styles.button}
              onClick={captureAndUpload}
            >
              {isCapturing ? "Capturing..." : buttonText}
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
    mb: 3,
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
    mt: "auto",

    minWidth: 120, // Ensures size for tablets
    "&:active": {
      backgroundColor: "primary.dark", // Visual feedback on tap
    },
  },
};
