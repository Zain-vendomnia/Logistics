import Box from "@mui/material/Box/Box";
import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";

import { DynamicTourPayload } from "../../types/tour.type";
import useDynamicTourStore from "../../store/useDynamicTourStore";
import adminApiService from "../../services/adminApiService";
import { useEffect, useState } from "react";

const DynamicTourList = () => {
  const { dynamicTours, selectedTour, setSelectedTour } = useDynamicTourStore();

  const handleTourSelect = (tour: DynamicTourPayload) => {
    setSelectedTour(tour);
  };

  // const [count, setCount] = useState(11);
  // useEffect(() => {
  //   const addNewOrder = () => {
  //     adminApiService.newShopOrder(count);
  //     setCount((p) => p + 1);
  //   };

  //   let interval: ReturnType<typeof setInterval>;
  //   const timeout = setTimeout(() => {
  //     interval = setInterval(() => {
  //       addNewOrder();
  //     }, 5000);
  //   }, 10000);

  //   return () => {
  //     clearTimeout(timeout);
  //     clearInterval(interval);
  //   };
  // }, []);

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

export default DynamicTourList;
