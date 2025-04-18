import { useState, useEffect, useRef } from "react";

import { Button, Box, Modal, IconButton, Typography } from "@mui/material";
import SignatureCanvas from "react-signature-canvas";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
  label?: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (signatureData: string) => void;
}

const SignatureBox = ({ label, open, onClose, onSubmit }: Props) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    if (sigCanvas.current) {
      const canvas = sigCanvas.current.getCanvas();
      canvas.style.cursor = 'url("/pencil.png") 10 10, crosshair';
    }
  }, []);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setIsSigned(false);
  };

  const handleSubmit = () => {
    if (sigCanvas.current) {
      const signatureData = sigCanvas.current.toDataURL("image/png");
      onSubmit(signatureData);
      onClose();
    }
  };

  return (
    <Modal open={open}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          boxShadow: 24,
          p: 3,
          borderRadius: 2,
          width: "90%",
          maxWidth: 900,
        }}
      >
        <Box
          width={"100%"}
          display="flex"
          alignItems="center"
          justifyContent={"space-between"}
        >
          <Typography variant="h4" color={"primary"} fontWeight={600}>
            {label ?? "Customer's Signature"}
          </Typography>
          <IconButton onClick={onClose} sx={{ ml: "auto" }}>
            <CloseIcon sx={{ color: "grey.900" }} />
          </IconButton>
        </Box>
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          onEnd={() => setIsSigned(true)}
          minWidth={0.5}
          maxWidth={2.5}
          velocityFilterWeight={0.7}
          canvasProps={{
            width: 800,
            height: 350,
            color: "white",
            className: "sigCanvas",
            style: { border: "2px dashed #000", borderRadius: 12 },
          }}
        />
        <Box mt={2} display="flex" gap={2}>
          <Button onClick={clearSignature} variant="outlined">
            Clear
          </Button>
          <Button
            variant="contained"
            disabled={!isSigned}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SignatureBox;
