import { useState } from "react";

import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import CameraCapture from "../common/Camera_Capture";
import SignatureBox from "../common/Signature_Box";
import { grey } from "@mui/material/colors";

interface Props {
  isReachedToDestination?: (isCompleted: boolean) => void;
}

const PostTripChecks = ({ isReachedToDestination: onComplete }: Props) => {
  const styles = useStyles;

  const [isImageUploaded, setIsImageUploaded] = useState(false);
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
  };

  return (
    <Box
      height={"100%"}
      display={"flex"}
      gap={2}
      flexDirection={"column"}
      alignItems={"flex-start"}
      justifyContent={"center"}
    >
      <IconButton
        onClick={() => onComplete?.(false)}
        sx={{
          p: 0,
          border: "1px solid",
          borderRadius: "50%",
          borderColor: "primary.main",
        }}
      >
        <KeyboardBackspaceIcon color="primary" fontSize="medium" />
      </IconButton>
      <Stack spacing={3} width="100%" height="100%">
        <Container disableGutters sx={{ padding: 0, margin: 0 }}>
          <Typography variant={"h6"} pb={isImageUploaded ? 0 : 3}>
            Uplaod Delivery Picture
          </Typography>
          <Box
            display={"flex"}
            justifyContent={"center"}
            p={4}
            borderRadius={2}
            border={"1px solid"}
            borderColor={grey[400]}
          >
            <CameraCapture
              showCameraIcon={true}
              isMarkDone={isImageUploaded}
              onUpload={(res) => setIsImageUploaded(res)}
            />
          </Box>
        </Container>

        <Divider />

        <Container disableGutters sx={{ padding: 0, margin: 0 }}>
          <Typography variant={"h6"} pb={3}>
            Customer Signature
          </Typography>
          <Box display={"flex"} justifyContent={"center"}>
            <SignatureBox
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
                    <CheckCircleIcon
                      color={"success"}
                      sx={{ fontSize: "48px" }}
                    />
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
        </Container>
      </Stack>
      <Box display={"flex"} justifyContent={"center"} width={"100%"}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onComplete?.(true)}
          sx={styles.notifyButton}
          disabled={!(isImageUploaded && isSigUploaded)}
        >
          Delivered
        </Button>
      </Box>
    </Box>
  );
};

export default PostTripChecks;

const useStyles = {
  notifyButton: {
    position: "relative",
    padding: "6px 12px",
    borderRadius: 2,
    width: "15vw",
    minWidth: 180,
    maxWidth: 240,
    height: "9vh",
    fontSize: "1.05rem",
    fontStyle: "bold",
  },
};
