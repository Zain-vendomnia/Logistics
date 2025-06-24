import { useCallback, useState } from "react";
import { Avatar, Box, Button, Divider, Stack, Typography } from "@mui/material";
import { grey } from "@mui/material/colors";
import { alpha, Theme, useTheme } from "@mui/material/styles";
import FmdGoodIcon from "@mui/icons-material/FmdGood";

import { DeliveryItem, DeliveryStatus } from "../delivery/Delivery_Drawer";
import { useDeliveryStore } from "../../store/useDeliveryStore";
import { useNotificationStore } from "../../store/useNotificationStore";
import ClientContactButtons from "../communications/Client_Contact_Buttons";
import MessageBox from "../communications/Message_Box";

const getStatusColorCode = (status: DeliveryStatus, theme: Theme) => {
  switch (status) {
    case DeliveryStatus.PENDING:
      return "#666";
    case DeliveryStatus.COMPLETED:
      return theme.palette.error.main;
    case DeliveryStatus.DELIVERED:
      return theme.palette.success.main;
    case DeliveryStatus.ACTIVE:
      return theme.palette.primary.main;
    default:
      return "#222";
  }
};

const colorOverlay = (color: string, opacity = 0.1) => {
  return alpha(color, opacity);
};

const style = {
  clientAvatarSize: "2.5rem",
  outerBox: {
    bgcolor: "white",
    border: "3px solid",
    borderRadius: 2,
    p: 2,
    minWidth: 290,
  },
  locationIcon: {
    fontSize: "2.5rem",
    p: 1,
    borderRadius: "50%",
  },
  contactIcon: {
    fontSize: "2.5rem",
    borderRadius: "50%",
    bgcolor: (theme: Theme) => colorOverlay(theme.palette.primary.main),
    p: 0.8,
  },
};

interface Props {
  deliveryItem: DeliveryItem;
}

const TripListItem = ({ deliveryItem }: Props) => {
  const theme = useTheme();
  const store = useDeliveryStore();

  const [isDeliveredClicked, setIsDeliveredClicked] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] =
    useState<boolean>(false);

  const [showMessageBox, setShowMessageBox] = useState(false);

  const showCustomer =
    deliveryItem.status === DeliveryStatus.ACTIVE ||
    (deliveryItem.status === DeliveryStatus.COMPLETED && showCustomerDetails);

  const handleBoxClick = useCallback(() => {
    if (
      deliveryItem.status === DeliveryStatus.ACTIVE ||
      deliveryItem.status === DeliveryStatus.COMPLETED
    ) {
      setShowCustomerDetails((prev) => !prev);
    } else if (deliveryItem.status === DeliveryStatus.DELIVERED) {
      setIsDeliveredClicked((prev) => !prev);
    }
  }, [deliveryItem.status]);

  const showNotification = useNotificationStore((s) => s.showNotification);
  const handleRequestConnect = useCallback(() => {
    showNotification({
      message: "Request to connect with customer sent to Support",
    });
  }, [showNotification]);

  return (
    <>
      <Box
        sx={{
          ...style.outerBox,
          borderColor: colorOverlay(
            getStatusColorCode(deliveryItem.status, theme),
            0.7
          ),
          ...(deliveryItem.status !== DeliveryStatus.ACTIVE && {
            bgcolor: colorOverlay(
              getStatusColorCode(deliveryItem.status, theme),
              0.06
            ),
          }),
        }}
      >
        <Stack spacing={2} width={"100%"} onClick={handleBoxClick}>
          <Box
            display="flex"
            alignItems={"center"}
            justifyContent={"space-between"}
          >
            <Stack spacing={0}>
              <Typography variant="body2" color={grey[600]}>
                Delivery number
              </Typography>
              <Typography variant="body1">{deliveryItem.deliveryId}</Typography>
            </Stack>
            <Box
              sx={{
                bgcolor: colorOverlay(
                  getStatusColorCode(deliveryItem.status, theme)
                ),
                borderRadius: 2,
                p: 1,
              }}
            >
              <Typography
                variant="body2"
                // sx={{ color: theme.palette.primary.dark }}
                sx={{
                  color: getStatusColorCode(deliveryItem.status, theme),
                }}
              >
                {deliveryItem.status}
              </Typography>
            </Box>
          </Box>

          <Divider color={grey[200]} />

          <Box display="flex" gap={2}>
            <FmdGoodIcon
              sx={{
                ...style.locationIcon,
                ...(deliveryItem.status === DeliveryStatus.ACTIVE
                  ? {
                      color: "success.main",
                      bgcolor: (theme: Theme) =>
                        colorOverlay(theme.palette.secondary.main),
                    }
                  : {
                      color: "#444",
                      bgcolor: (theme: Theme) => colorOverlay("#222"),
                    }),
              }}
            />
            <Stack spacing={0}>
              <Typography variant="h6" fontWeight={"bold"} lineHeight={1}>
                {deliveryItem.address}
              </Typography>
              <Typography variant="body1" color={grey[600]}>
                {deliveryItem.area}
              </Typography>
            </Stack>
          </Box>
        </Stack>

        {isDeliveredClicked && (
          <Stack spacing={2} mt={2}>
            <Divider color={grey[200]} />
            <Box display={"flex"} gap={0} justifyContent={"flex-end"}>
              <Button
                // variant="contained"
                onClick={handleRequestConnect}
                sx={{
                  px: 2,
                  py: 0.5,
                  // fontSize: theme.typography.caption.fontSize,
                }}
              >
                Request Connect
              </Button>
            </Box>
          </Stack>
        )}

        {showCustomer && (
          <Stack spacing={2} mt={2}>
            <Divider color={grey[200]} />
            <Box display={"flex"} justifyContent={"space-between"}>
              <Box display="flex" gap={2} alignItems={"center"}>
                <Avatar
                  alt="client_image"
                  src="client_image.png"
                  sx={{
                    width: style.clientAvatarSize,
                    height: style.clientAvatarSize,
                  }}
                />
                <Stack spacing={0}>
                  <Typography variant="body2" color={grey[600]}>
                    Client
                  </Typography>
                  <Typography variant="h6" fontWeight={"bold"} lineHeight={1}>
                    {deliveryItem.clientName}
                  </Typography>
                </Stack>
              </Box>
              <Box display={"flex"} gap={0} mx={0}>
                <ClientContactButtons
                  onMessageClicked={() => setShowMessageBox((val) => !val)}
                  setStyle
                />
              </Box>
            </Box>

            {showMessageBox && (
              <MessageBox
                inBox
                deliveryId={deliveryItem.deliveryId}
                onClose={() => setShowMessageBox(false)}
              />
            )}
          </Stack>
        )}
      </Box>
    </>
  );
};

export default TripListItem;
