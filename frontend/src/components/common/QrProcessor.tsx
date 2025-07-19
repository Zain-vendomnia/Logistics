import React, { useEffect, useState } from "react";

import { Box, IconButton, Modal, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { motion } from "framer-motion";
import { useShakeEvery } from "../base-ui/useShakeEvery";
import QrScanner from "./QrScanner";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: "55vw",
  width: "55%",
  bgcolor: "background.paper",
  borderColor: "primary.dark",
  // border: '2px solid #000',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

interface Props {
  onComplete?: () => void;
}

const QrProcessor = ({ onComplete }: Props) => {
  const { key, animation } = useShakeEvery(true);

  const [showModal, setShowModal] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleScanSuccess = async (decodedText: string) => {
    setScannedData(decodedText);
  };

  const solarModels = ["SLMDL500N", "SLMDL460N"];

  useEffect(() => {
    if (!scannedData) return;

    const normalize = (str: string) =>
      str
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^\x20-\x7E]/g, "");

    const model = normalize(scannedData);
    const isValidModel = solarModels.some((m) => model.includes(m));

    if (isValidModel) {
      setSuccess(true);
      setTimeout(() => {
        setShowModal(false);
        onComplete?.();
      }, 2000);
    } else {
      setError("Incorrect Panels Scanned!");
    }
  }, [scannedData, onComplete]);

  useEffect(() => {
    if (!showModal && !scannedData) {
      const timeout = setTimeout(() => {
        setShowModal(true);
      }, 2000);

      return clearTimeout(timeout);
    }

    return;
  }, [showModal, scannedData]);

  return (
    <>
      <Modal open={showModal}>
        <Box sx={style}>
          <IconButton
            onClick={() => {
              setShowModal(false);
            }}
            sx={{ position: "absolute", top: 10, right: 10 }}
          >
            <CloseIcon />
          </IconButton>
          <Stack spacing={3}>
            <Typography variant="h5" fontWeight={"bold"} align={"center"}>
              Scan QR Code
            </Typography>
            <QrScanner onScanSuccess={handleScanSuccess} />

            {scannedData && (
              <Box textAlign="center">
                {error && (
                  <motion.div key={key} animate={animation}>
                    <Typography variant="h6" color="error">
                      {error}
                    </Typography>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Typography variant="h4" color="success.main">
                      Valid Panel!
                    </Typography>
                  </motion.div>
                )}
                <Typography
                  variant="body1"
                  sx={{ wordBreak: "break-all", overflowWrap: "break-word" }}
                >
                  Scanned Data:{" "}
                  <span style={{ fontWeight: "bold" }}> {scannedData}</span>
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Modal>
    </>
  );
};

export default QrProcessor;
