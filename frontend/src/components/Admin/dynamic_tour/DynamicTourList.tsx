import Box from "@mui/material/Box/Box";
import {
  Chip,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";

import { DynamicTourPayload } from "../../../types/tour.type";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import XChip from "../../base-ui/XChip";

const DynamicTourList = () => {
  const { dynamicTours, selectedTour, setSelectedTour } = useDynamicTourStore();

  const handleTourSelect = (tour: DynamicTourPayload) => {
    if (tour.id === selectedTour?.id) {
      setSelectedTour(null);
      return;
    } else {
      setSelectedTour(tour);
    }
  };

  const getOrderCount = (orderIds: string) => {
    return orderIds.split(",").length;
  };

  console.log("dynamicTours", dynamicTours);
  return (
    <Box width={"100%"} height="100%" overflow="auto">
      <Box display={"flex"} justifyContent={"center"} p={1} mb={1}>
        <Typography variant="h5" fontWeight={"bold"} color="primary.dark">
          Dynamic Tours
        </Typography>
      </Box>
      <List disablePadding>
        {dynamicTours.map((tour) => (
          <ListItem disablePadding key={tour.tour_number}>
            <ListItemButton
              onClick={() => handleTourSelect(tour)}
              sx={{
                padding: 1,
                border: "1px solid #ccc",
                borderRadius: 2,
                marginBottom: 1,
                backgroundColor:
                  selectedTour?.id === tour.id ? "#f0f0f0" : "#fff",
                cursor: "pointer",
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <Chip color="error" size="small" />
                  <Typography sx={{ fontSize: "1.1rem" }}>
                    {tour.tour_number}
                  </Typography>

                  {/* <Badge color="secondary" badgeContent={80} /> */}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <XChip
                    label={`Ziele ${getOrderCount(tour.orderIds)}`}
                    color="info"
                    variant="outlined"
                  />
                  <XChip
                    label={`Menge ${tour.totalOrdersItemsQty}`}
                    color="success"
                    variant="outlined"
                  />
                  <XChip
                    label={`C: ${new Date(tour.created_at!).toLocaleDateString()}`}
                    color="#777"
                    variant="outlined"
                  />
                </Stack>
                {tour.updated_by && tour.updated_at && (
                  <Stack direction="row" spacing={1}>
                    <XChip
                      label={`${tour.updated_by.split("@")[0]} - ${new Date(tour.updated_at).toLocaleDateString()}`}
                      color="warning"
                      variant="outlined"
                    />
                  </Stack>
                )}
              </Stack>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DynamicTourList;
