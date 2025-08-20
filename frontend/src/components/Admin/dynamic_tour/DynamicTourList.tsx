import Box from "@mui/material/Box/Box";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";

import { DynamicTourPayload } from "../../../types/tour.type";
import useDynamicTourStore from "../../../store/useDynamicTourStore";

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
              <Typography sx={{ fontSize: "1.2rem" }}>
                {tour.tour_number}
              </Typography>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DynamicTourList;
