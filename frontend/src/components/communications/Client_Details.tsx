import { useEffect, useState } from "react";

import { Avatar, Box, Divider, Stack, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";

import ClientContactButtons from "./Client_Contact_Buttons";
import MessageBox from "./Message_Box";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { motion } from "framer-motion";
import { fade, shake, slideUp } from "../base-ui/motionPresets";

const ClientDetails = () => {
  const store = useDeliveryStore();
  const tripData = store?.tripData;

  const [showMessageBox, setShowMessageBox] = useState(false);

  return (
    <Stack spacing={2} width="100%" px={0}>
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
            <motion.div variants={fade} initial="hidden" animate="visible">
              <motion.div variants={slideUp}>
                <Typography
                  variant="body1"
                  fontWeight={"bold"}
                  color={grey[800]}
                >
                  Customer
                </Typography>
                <Typography variant="body1" fontSize={"large"}>
                  {tripData?.client.name}
                </Typography>
              </motion.div>
            </motion.div>
          </Stack>
        </Box>

        <motion.div variants={shake} initial="initial" animate="animate">
          <ClientContactButtons
            onMessageClicked={() => setShowMessageBox(!showMessageBox)}
          />
        </motion.div>
      </Box>
      {showMessageBox && (
        <MessageBox
          deliveryId={store.deliveryId}
          onClose={() => setShowMessageBox(false)}
        />
      )}

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
