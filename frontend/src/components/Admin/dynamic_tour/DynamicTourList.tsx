import Box from "@mui/material/Box/Box";
import {
  Chip,
  FormControl,
  List,
  ListItem,
  ListItemButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { DynamicTourPayload } from "../../../types/tour.type";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import XChip from "../../base-ui/XChip";
import { ChangeEvent, useState } from "react";
import { Height } from "@mui/icons-material";

const DynamicTourList = () => {
  const { dynamicTours, selectedTour, setSelectedTour } = useDynamicTourStore();
  console.log("dynamicTours", dynamicTours);

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

  const [dynamicTourList, setDynamicTourList] = useState(dynamicTours);

  const [searchItem, setSearchItem] = useState("");

  const handleTourSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const searchString = e.target.value;
    setSearchItem(searchString);

    if (!searchString) {
      setDynamicTourList(dynamicTours);
      return;
    }

    let resultArray: DynamicTourPayload[] = dynamicTours.filter((t) =>
      t.tour_number
        ?.toString()
        .toLocaleLowerCase()
        .includes(searchString.toLocaleLowerCase())
    );

    // if (resultArray.length === 0 ){
    // dynamicTours.filter(t => t.warehouse_name || t.locationName)
    // }

    if (resultArray.length > 0) setDynamicTourList(resultArray);
  };

  return (
    <Box
      display={"flex"}
      flexDirection={"column"}
      gap={1}
      width={"100%"}
      height="100%"
      overflow="auto"
    >
      <Box display={"flex"} justifyContent={"center"} mb={1}>
        <Typography variant="h5" fontWeight={"bold"} color="primary.dark">
          Dynamic Tours
        </Typography>
      </Box>

      <FormControl>
        <TextField
          size="small"
          placeholder="Search Tour"
          value={searchItem}
          // onFocus={() => setSearchItem("")}
          onChange={handleTourSearch}
          disabled={false}
        />
      </FormControl>

      <List disablePadding>
        {dynamicTourList.map((tour) => (
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
                  <Chip
                    sx={{
                      height: 27,
                      width: 15,
                      bgcolor: (tour.warehouse_colorCode as any) || "error",
                    }}
                  />

                  <Typography sx={{ fontSize: "1.1rem" }}>
                    {tour.tour_number}
                  </Typography>
                  {/* <Badge color="secondary" badgeContent={80} /> */}
                </Stack>
                <Stack
                  direction="row"
                  // spacing={1}
                  flexWrap={"wrap"}
                  gap={1}
                  overflow={"hidden"}
                >
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
