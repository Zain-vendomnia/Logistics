import Box from "@mui/material/Box/Box";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

import { DynamicTourPayload } from "../../types/tour.type";
import useDynamicTourStore from "../../store/useDynamicTourStore";

const DynamicTours = () => {
  const { dynamicTours, selectedTour, setSelectedTour } = useDynamicTourStore();

  const handleTourSelect = (tour: DynamicTourPayload) => {
    setSelectedTour(tour);
  };

  return (
    <Box width={"100%"} height="100%" overflow="auto">
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
              <ListItemText>{tour.tour_number}</ListItemText>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default DynamicTours;
