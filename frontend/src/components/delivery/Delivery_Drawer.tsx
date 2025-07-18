import { useEffect, useRef, useState } from "react";

import {
  Box,
  Fab,
  Stack,
  SwipeableDrawer,
  Tooltip,
  Typography,
} from "@mui/material";
import MultipleStopIcon from "@mui/icons-material/MultipleStop";

import { grey } from "@mui/material/colors";
import TripListItem from "../base-ui/TripListItem";
import ScrollContainer from "../base-ui/ScrollContainer";
import { useDeliveryStore } from "../../store/useDeliveryStore";

export enum DeliveryStatus {
  PENDING = "Up Coming",
  COMPLETED = "Completed",
  DELIVERED = "Delivered",
  CANCELLED = "Cancelled",
  ACTIVE = "Active",
}

export type DeliveryItem = {
  status: DeliveryStatus;
  deliveryId: string;
  address: string;
  area: string;
  clientName: string;
};

const DeliveryDrawer = () => {
  const store = useDeliveryStore();
  const deliveryList: DeliveryItem[] = [
    {
      status: DeliveryStatus.DELIVERED,
      deliveryId: "SL-P1a0BA",
      address: "Park Lane 30, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack",
    },
    {
      status: DeliveryStatus.COMPLETED,
      deliveryId: "SL-P2a0BB",
      address: "Park Lane 32, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "Machron",
    },
    {
      status: DeliveryStatus.CANCELLED,
      deliveryId: "SL-P3a0BC",
      address: "Park Lane 34, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack Machron",
    },
    {
      status: DeliveryStatus.ACTIVE,
      deliveryId: store.deliveryId,
      address: "Park Lane 32, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "Machron",
    },
    {
      status: DeliveryStatus.PENDING,
      deliveryId: "SL-P4a0BD",
      address: "Park Lane 36, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack",
    },
    {
      status: DeliveryStatus.PENDING,
      deliveryId: "SL-P5a0BE",
      address: "Park Lane 38, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack",
    },
    {
      status: DeliveryStatus.PENDING,
      deliveryId: "SL-P4a0BD",
      address: "Park Lane 36, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack",
    },
    {
      status: DeliveryStatus.PENDING,
      deliveryId: "SL-P5a0BE",
      address: "Park Lane 38, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack",
    },
    {
      status: DeliveryStatus.PENDING,
      deliveryId: "SL-P4a0BD",
      address: "Park Lane 36, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack",
    },
    {
      status: DeliveryStatus.PENDING,
      deliveryId: "SL-P5a0BE",
      address: "Park Lane 38, West Zone",
      area: "Lagos, FrankFurt",
      clientName: "John Pack",
    },
  ];

  const drawerSize = { md: "31vw", lg: "27vw" };
  const [showDrawer, setShowDrawer] = useState(false);
  const activeDeliveryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeDeliveryRef.current) {
      requestAnimationFrame(() => {
        activeDeliveryRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  }, [showDrawer]);

  return (
    <>
      <Tooltip title="Side Options">
        <Fab
          onClick={() => {
            setShowDrawer((prev) => !prev);
          }}
          color="primary"
          aria-label="open delivery drawer"
          sx={{
            position: "absolute",
            top: 55,
            right: showDrawer ? drawerSize : "1vw",
            zIndex: 1000,
            transition: "right 0.3s ease-in-out",
            // animation: !isDrawerClicked
            //   ? `${blinkOverlay} 1.5s infinite`
            //   : "none",
          }}
        >
          <MultipleStopIcon
            sx={{
              transform: showDrawer ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.7s",
            }}
          />
        </Fab>
      </Tooltip>

      <SwipeableDrawer
        anchor="right"
        open={showDrawer}
        onOpen={() => {}}
        onClose={() => setShowDrawer((prev) => !prev)}
      >
        <Box
          display="flex"
          flexDirection="column"
          height="100%"
          width={drawerSize}
        >
          <Box
            position="relative"
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="50px"
            bgcolor="primary.main"
          >
            <Typography variant="h5" fontWeight="bold" color="#fff">
              Ongoing Trip
            </Typography>
          </Box>

          <Box
            bgcolor={grey[200]}
            flex={1}
            pt={3}
            pl={3}
            pr={1}
            overflow={"hidden"}
          >
            <ScrollContainer>
              <Stack spacing={3} pb={2}>
                {deliveryList.map((item, index) => (
                  <Box
                    // key={item.deliveryId}
                    ref={
                      item.status === DeliveryStatus.ACTIVE
                        ? activeDeliveryRef
                        : null
                    }
                  >
                    <TripListItem deliveryItem={item} />
                  </Box>
                ))}
              </Stack>
            </ScrollContainer>
          </Box>
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default DeliveryDrawer;
