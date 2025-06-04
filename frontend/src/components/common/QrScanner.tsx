import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Box, Button, Stack, Typography } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";

type Props = {
  onScanSuccess?: (decodedText: string) => void;
  onScanFailure?: (error: string) => void;
};

const QrScanner = ({ onScanSuccess, onScanFailure }: Props) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const qrCodeRegionId = "qr-reader";

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Failed to stop QR scanner", err);
      }
      setIsCameraOn(false);
    }
  }, []);

  const startScanner = useCallback(async () => {
    const fps = 10;
    const qrbox = { width: 280, height: 280 };

    setScannedData(null);
    if (!qrRef.current) return;

    scannerRef.current = new Html5Qrcode(qrCodeRegionId);
    setIsCameraOn(true);

    try {
      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps,
          qrbox,
          aspectRatio: 4 / 3,
        },
        (decodedText, decodedResult) => {
          // console.log("Decoded:", decodedText, decodedResult);
          setScannedData(decodedText);
          onScanSuccess?.(decodedText);
        },
        (errorMessage) => {
          onScanFailure?.(errorMessage);
        }
      );
    } catch (err) {
      console.error("Failed to start QR scanner", err);
    }
  }, [qrCodeRegionId, setScannedData, onScanSuccess, onScanFailure]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [scannedData, stopScanner]);

  return (
    <>
      <Stack spacing={3} alignItems="center">
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: "500px",
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid",
            borderColor: "primary.dark",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: !isCameraOn ? "background.default" : "transparent",
          }}
        >
          <Box
            component="div"
            id={qrCodeRegionId}
            ref={qrRef}
            style={{ width: "100%", height: "100%" }}
          />
          {!isCameraOn && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "text.secondary",
                textAlign: "center",
              }}
            >
              <QrCodeScannerIcon sx={{ fontSize: "10rem" }} />
              <Typography variant="body2" mt={1}>
                Click to start scanning
              </Typography>
            </Box>
          )}
        </Box>

        <Stack direction="row" justifyContent={"center"} spacing={2}>
          {!isCameraOn ? (
            <Button variant="contained" color="primary" onClick={startScanner}>
              Start Scanner
            </Button>
          ) : (
            <Button variant="outlined" color="error" onClick={stopScanner}>
              Stop Scanner
            </Button>
          )}
        </Stack>
      </Stack>
    </>
  );
};

export default QrScanner;
