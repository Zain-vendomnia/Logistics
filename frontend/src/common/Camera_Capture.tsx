import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Box, Button } from "@mui/material";

interface Props {
  buttonText: string;
  buttonDisabled?: boolean;
  onUpload?: (imageUploaded: boolean) => void;
  isMarkDone?: boolean;
}
const CameraCapture = ({
  buttonText,
  buttonDisabled,
  onUpload,
  isMarkDone,
}: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  const uploadImage = async (imageSrc: string) => {
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
        uploadImage(imageSrc);
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
        <Button disabled={isMarkDone}>Completed</Button>
      ) : (
        <Button
          disabled={buttonDisabled}
          size="small"
          variant="outlined"
          sx={{
            borderColor: "#f7941d",
            color: "#f7941d",
            width: "auto",
            mt: "auto",
          }}
          onClick={captureAndUpload}
        >
          {isCapturing ? "Capturing..." : buttonText}
        </Button>
      )}
    </Box>
  );
};

export default CameraCapture;
