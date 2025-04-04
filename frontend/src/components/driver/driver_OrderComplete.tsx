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

import CameraCapture from "../../common/Camera_Capture";
import SignatureBox from "../../common/Signature_Box";

interface Props {
  onComplete?: (isCompleted: boolean) => void;
}

const OrderComplete = ({ onComplete }: Props) => {
  const styles = useStyles;

  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const [showSigBox, setShowSigBox] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSigUploaded, setSigUploaded] = useState(false);
  const [rating, setRating] = useState<number>(0);

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

  const handleRatingChange = (value: number) => {
    console.log(value);
  };

  return (
    <Box
      display={"flex"}
      gap={2}
      flexDirection={"column"}
      alignItems={"flex-start"}
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
            // p={4}
            // borderRadius={2}
            // border={"1px solid"}
            // borderColor={grey[400]}
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

        <Divider />
        <Container disableGutters sx={{ padding: 0, margin: 0 }}>
          <Typography variant="h6">Customer Rating</Typography>

          {/* <StartRating rating={7} /> */}
          <Box m={0} p={0}>
            <Rating
              name="customer-review"
              defaultValue={0}
              value={rating}
              precision={1}
              emptyIcon={<StarBorderIcon color="primary" fontSize="inherit" />}
              sx={{ fontSize: "40px" }}
              // onChange={(event, value) => console.log(value)}
              onChange={(_, value) => {
                console.log(value);
                setRating(value as number);
              }}
            />
          </Box>
        </Container>

        <Box display="flex" justifyContent={"center"}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onComplete?.(true)}
            sx={styles.notifyButton}
          >
            Delivered
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default OrderComplete;

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
