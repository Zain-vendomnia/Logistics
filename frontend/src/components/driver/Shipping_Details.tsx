import React from "react";
import {
  Box,
  Chip,
  Divider,
  ImageListItem,
  Stack,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PinDropIcon from "@mui/icons-material/PinDrop";
import CallIcon from "@mui/icons-material/Call";
import CommentIcon from "@mui/icons-material/Comment";
import CloseIcon from "@mui/icons-material/Close";
import TripData from "../../services/trip_Service";
import useStyles from "./Shipping_Details_styles";

interface Props {
  tripData: TripData | null;
}

const ShippingDetails = ({ tripData }: Props) => {
  const styles = useStyles;
  const quickMessages = [
    "Arriving soon",
    "I'm nearby",
    "I'm arrived",
    "At your doorstep",
  ];

  if (!tripData) return null;

  return (
    <Stack>
      <Typography variant={"h5"} fontSize={"medium"} mb={2}>
        Ongoing Delivery
      </Typography>
      <Box display={"flex"} flexDirection={"column"} gap={2} p={1}>
        <Box
          display={"flex"}
          alignItems={"flex-start"}
          justifyContent={"space-between"}
        >
          <Box display={"flex"} flexDirection={"column"}>
            <Typography variant="body1" fontStyle={"small"} color={grey[600]}>
              Shipping number
            </Typography>
            <Typography variant="h6">{tripData?.shippingId}</Typography>
            <Typography variant="body2" color={grey[500]}>
              Fragile Cargo
            </Typography>
          </Box>
          <Box
            component="img"
            src="/cargo.png"
            alt="cargo"
            mt={'-15px'}
            sx={{ width: 90, height: 60, borderRadius: "8px" }}
          />
        </Box>
        <Divider color={grey[100]} />
        <Stack spacing={2}>
          <Box display={"flex"} alignItems={"center"} gap={2}>
            <MyLocationIcon fontSize="small" sx={{ color: "#16C47F" }} />
            <Typography variant="body2"> {tripData?.startPoint}</Typography>
          </Box>
          <Box display={"flex"} alignItems={"center"} gap={2}>
            <PinDropIcon fontSize="small" color="primary" />
            <Typography>
              {tripData?.client.address.includes(",") ? (
                (() => {
                  const address = tripData.client.address.split(",");
                  return (
                    <>
                      <Typography variant="body2">{address[1]}</Typography>
                      <Typography
                        variant="body2"
                        fontSize={"small"}
                        color={grey[700]}
                      >
                        {address[0]}
                      </Typography>
                    </>
                  );
                })()
              ) : (
                <Typography>{tripData?.client.address}</Typography>
              )}
            </Typography>
          </Box>
        </Stack>
        <Divider color={grey[100]} />
        <Box display={"flex"} alignItems={"center"} gap={2}>
          <ImageListItem>
            <img
              src="https://cdn.vectorstock.com/i/1000v/00/74/young-man-profile-vector-14770074.avif"
              alt="client_image"
              style={{ width: "40px", height: "40px", borderRadius: "50%" }}
            />
          </ImageListItem>
          <Stack>
            <Typography variant="body2" fontSize={"small"} color={grey[600]}>
              Client
            </Typography>
            <Typography variant="body2"> {tripData?.client.name}</Typography>
          </Stack>
          <Box display={"flex"} gap={3} ml="auto">
            <CommentIcon fontSize="small" color="primary" />
            <CallIcon fontSize="small" color="primary" />
          </Box>
        </Box>
      </Box>

      <Box sx={styles.messageBox}>
        <Box
          display="flex"
          alignItems={"center"}
          justifyContent="space-between"
          mb={2}
          borderRadius={1}
        >
          <Typography variant="body2" color={grey[600]}>
            Send Message
          </Typography>
          <CloseIcon
            sx={{ fontSize: "15px", color: grey[600], borderRadius: "50%" }}
          />
        </Box>

        {quickMessages.map((item) => (
          <Chip label={item} variant="outlined" sx={styles.chip} />
        ))}
      </Box>
    </Stack>
  );
};

export default ShippingDetails;
