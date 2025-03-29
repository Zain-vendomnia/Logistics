import CameraCapture from "../../common/Camera_Capture";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Rating,
  Stack,
  Typography,
} from "@mui/material";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import KeyboardBackspaceIcon from "@mui/icons-material/KeyboardBackspace";
import { grey } from "@mui/material/colors";

import StartRating from "../../common/Start_Rating";
import { useState } from "react";

interface Props {
  onComplete?: (isCompleted: boolean) => void;
}

const OrderComplete = ({ onComplete }: Props) => {
  const styles = useStyles;

  const [rating, setRating] = useState(0);

  const handleRatingChange = (value: number) => {
    console.log(value);
  };

  return (
    <Box
      display={"flex"}
      gap={1}
      flexDirection={"column"}
      alignItems={"flex-start"}
    >
      <IconButton onClick={() => onComplete?.(false)}>
        <KeyboardBackspaceIcon fontSize="medium" />
      </IconButton>
      <Stack spacing={3} width="100%" height="100%">
        <Typography>Uplaod Confirmation Picture </Typography>
        <Box
          display={"flex"}
          justifyContent={"center"}
          // p={4}
          // borderRadius={2}
          // border={"1px solid"}
          // borderColor={grey[400]}
        >
          <CameraCapture showCameraIcon={true} />
        </Box>

        <Stack spacing={0}>
          <Typography variant="body1">Customer Signature</Typography>
          <Box></Box>
        </Stack>

        <Divider />
        <Stack spacing={0}>
          <Typography variant="body1">Customer Rating</Typography>

          {/* <StartRating rating={7} /> */}
          <Rating
            name="customer-review"
            defaultValue={rating}
            // value={2.5}
            precision={0.5}
            emptyIcon={<StarBorderIcon color="primary" fontSize="inherit" />}
            sx={{ fontSize: "40px" }}
            // onChange={(event, value) => console.log(value)}
            onChange={(event, value) => setRating(value as number)}
          />
        </Stack>

        <Divider />

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
