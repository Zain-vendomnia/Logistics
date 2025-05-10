import { useState } from "react";

import { Box, Button, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import SignatureBox from "./Signature_Box";
import { grey } from "@mui/material/colors";

interface Props {
  label: string;
  onComplete: () => void;
}
const SignatureUpload = ({ label, onComplete }: Props) => {
  const [showSigBox, setShowSigBox] = useState(true);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSigUploaded, setSigUploaded] = useState(false);

  const handleSigBoxClose = () => {
    setShowSigBox(false);
    setSigUploaded(false);
  };

  const handleSigBoxSubmit = (sigData: string) => {
    console.log("sugnature data: ", sigData);
    setShowSigBox(false);
    setSigUploaded(true);
    setSignature(sigData);
  };

  const uploadSignature = () => {
    console.log("To upload signature: ", signature);
    setSigUploaded(true);

    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      justifyContent={"space-between"}
      height={"100%"}
      width={"100%"}
      gap={3}
    >
      <SignatureBox
        label={label}
        open={showSigBox}
        onClose={handleSigBoxClose}
        onSubmit={(sigData) => handleSigBoxSubmit(sigData)}
      />
      <Typography variant="h5" color={"secondry"} fontWeight={600}>
        {label ?? "Customer's Signature"}
      </Typography>
      {signature ? (
        <Box
          component={"img"}
          src={signature}
          alt={"signature data"}
          border={"1px dashed"}
          width={"auto"}
          height={100}
        />
      ) : (
        <Box
          color={"#fff"}
          border={"1px dashed"}
          borderColor={grey[400]}
          width={"auto"}
          height={100}
        />
      )}
      <Box display={"flex"} justifyContent={"center"}>
        {isSigUploaded ? (
          <CheckCircleIcon color={"success"} sx={{ fontSize: "48px" }} />
        ) : signature ? (
          <Button
            variant="contained"
            color="primary"
            onClick={uploadSignature}
            sx={{ width: "15vw" }}
          >
            Upload
          </Button>
        ) : (
          <Button
            variant="outlined"
            onClick={() => setShowSigBox(true)}
            sx={{ width: "15vw" }}
          >
            Take Signature
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SignatureUpload;
