import { useState } from "react";

import { Alert, Box, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import UploadImage from "../../common/Upload_Image";
import SignatureBox from "./Signature_Box";

interface Props {
  label: string;
  onComplete: () => void;
}
const SignatureUpload = ({ label, onComplete }: Props) => {
  const [showSigBox, setShowSigBox] = useState(false);
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
    <Box display={"flex"} justifyContent={"center"}>
      <SignatureBox
        label={label}
        open={showSigBox}
        onClose={handleSigBoxClose}
        onSubmit={(sigData) => handleSigBoxSubmit(sigData)}
      />
      {!signature ? (
        <Button variant="outlined" onClick={() => setShowSigBox(true)}>
          Take Signature
        </Button>
      ) : (
        <Box>
          <Box
            component={"img"}
            src={signature}
            alt={"signature data"}
            border={"1px dashed"}
            width={"auto"}
            height={100}
          />

          <Box display={"flex"} justifyContent={"center"} mt={2}>
            {isSigUploaded ? (
              <CheckCircleIcon color={"success"} sx={{ fontSize: "48px" }} />
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={uploadSignature}
              >
                Upload
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SignatureUpload;
