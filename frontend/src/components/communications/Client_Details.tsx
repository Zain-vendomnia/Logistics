import { useState } from "react";

import { Avatar, Box, Divider, Stack, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";

import ContactIcons from "./Contact_Icons";
import MessageBox from "./Message_Box";
import { useDeliveryStore } from "../../store/useDeliveryStore";

const ClientDetails = () => {
  const store = useDeliveryStore();
  const tripData = store?.tripData;

  const [showMessageBox, setShowMessageBox] = useState(false);

  return (
    <Stack spacing={2} width="100%">
      <Box
        display={"flex"}
        alignItems={"center"}
        justifyContent={"space-between"}
      >
        <Box display={"flex"} gap={1}>
          <Avatar
            alt="client_image"
            src="https://cdn.vectorstock.com/i/1000v/00/74/young-man-profile-vector-14770074.avif"
            style={{
              width: "48px",
              height: "48px",
            }}
          />
          <Stack spacing={0}>
            <Typography variant="body1" fontWeight={"bold"} color={grey[800]}>
              Customer
            </Typography>
            <Typography variant="body1" fontSize={"large"}>
              {tripData?.client.name}
            </Typography>
          </Stack>
        </Box>

        <ContactIcons
          onMessageClicked={() => setShowMessageBox(!showMessageBox)}
        />
      </Box>
      {showMessageBox && (
        <MessageBox onClose={() => setShowMessageBox(false)} />
      )}
      <Divider color={grey[100]} />

      <Box>
        <Typography variant="h6" fontWeight={"bold"}>
          Address:
        </Typography>
        <Typography variant="body1" fontSize={"large"}>
          {tripData?.client.address}
        </Typography>
      </Box>

      <Divider color={grey[100]} />
    </Stack>
  );
};

export default ClientDetails;
