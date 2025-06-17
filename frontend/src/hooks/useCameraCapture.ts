import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "lodash";
import { uploadImage } from "../utils/upload_Image";
// import { uploadImage } from "../../services/trip_Service";

export enum ImageType {
  LoadCargo_TripStart = "loadCargoTripStart",
  Millage_TripStart = "millageTripStart",
  Millage_TripEnd = "millageTripEnd",
  TruckImage_TripEnd = "truckImageTripEnd",
  GasReceipt = "gasReceipt",
  ParcelImage = "parcelImage",
  ParcelImage_Damaged = "parcelImageDamaged",
  Customer_Doorstep = "customerDoorstep",
  Neighbor_Doorstep = "neighborDoorstep",
  Customer_Signature = "customerSignature",
  Neighbor_Signature = "neighborSignature",
  PermitScreenshot = "permitScreenshot",
}

export type CameraState = {
  active: boolean;
  captured: string | null;
  uploading: boolean;
  uploaded: boolean;
};

type Props = {
  type: ImageType;
  millage?: string;
  onComplete?: (imageUploaded: boolean) => void;
};

export const useCameraCapture = ({ type, millage, onComplete }: Props) => {
  const webcamRef = useRef<any>(null);
  const lastUploadedImageRef = useRef<string | null>(null);

  const [cameraState, setCameraState] = useState<CameraState>({
    active: false,
    captured: null,
    uploading: false,
    uploaded: false,
  });
  const updateCameraState = useCallback(
    (prop: keyof CameraState, value: boolean | string | null) => {
      setCameraState((prev) => ({
        ...prev,
        [prop]: value,
      }));
    },
    []
  );

  const uploadImageAsync = useCallback(
    async (imageSrc: string) => {
      if (!imageSrc || imageSrc === lastUploadedImageRef.current) return;

      lastUploadedImageRef.current = imageSrc;
      updateCameraState("uploading", true);

      // Simulate async upload
      setTimeout(() => {
        updateCameraState("uploading", false);
        updateCameraState("uploaded", true);

        // console.log("Image data: ", imageSrc);
        // console.log("Image type: ", type);
        // millage && console.log("Millage passed: ", millage);

        onComplete?.(true);
      }, 3000);

      // Actual upload logic
      //   try {
      //     const data = await uploadImage(imageSrc);

      //     console.log("Image Uploaded Data: ", data);
      //     showSnackbar(data, "success");

      //     updateCameraState("uploaded", true);
      //     showSnackbar("Image uploaded successfully.");
      //   } catch (error) {
      //     if (error instanceof Error) {
      //       showSnackbar(error.message, "error");
      //     } else {
      //       showSnackbar("An unknown error occurred", "error");
      //     }
      //   } finally {
      //     updateCameraState("uploading", false);
      //   }
    },
    [onComplete, updateCameraState]
  );

  const debouncedUpload = useMemo(
    () => debounce(uploadImageAsync, 1000),
    [uploadImageAsync]
  );

  const captureImage = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      updateCameraState("captured", imageSrc);
      updateCameraState("active", false);
    }
  }, [updateCameraState]);

  const retakeImage = useCallback(() => {
    updateCameraState("captured", null);
    updateCameraState("active", true);
  }, [updateCameraState]);

  const handleButtonClick = useCallback(() => {
    if (cameraState.active && !cameraState.captured) {
      captureImage();
    } else if (cameraState.captured) {
      debouncedUpload(cameraState.captured);
    } else {
      updateCameraState("active", true);
    }
  }, [cameraState, captureImage, debouncedUpload, updateCameraState]);

  const clearCamera = useCallback(() => {
    updateCameraState("active", false);
    updateCameraState("captured", null);
  }, [updateCameraState]);

  useEffect(() => {
    return () => {
      debouncedUpload.cancel();
    };
  }, [debouncedUpload]);

  return {
    webcamRef,
    cameraState,
    updateCameraState,
    handleButtonClick,
    retakeImage,

    captureImage,
    uploadImageAsync,

    clearCamera,
  };
};
