import { ChangeEvent, useState } from "react";
import Box from "@mui/material/Box/Box";
import {
  Chip,
  Divider,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FileDownloadDone,
  SwipeDownAlt,
  ImportExport,
  SwipeUpAlt,
} from "@mui/icons-material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";

import { DynamicTourPayload } from "../../../types/tour.type";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import XChip from "../../base-ui/XChip";
import { scrollStyles } from "../../../theme";
import { useDynamicTourService } from "../../../hooks/useDynamicTourService";

const DynamicTourList = () => {
  const fontsize = "0.95rem";
  const { theme } = useDynamicTourService();
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
      t.tour_name
        ?.toString()
        .toLocaleLowerCase()
        .includes(searchString.toLocaleLowerCase())
    );

    // if (resultArray.length === 0 ){
    // dynamicTours.filter(t => t.warehouse_name || t.locationName)
    // }

    if (resultArray.length > 0) setDynamicTourList(resultArray);
  };

  // ########
  const [expandDetailsPanel, setExpandDetailsPanel] = useState(false);

  return (
    <Box display="flex" gap={0} height="100%">
      <Paper
        elevation={2}
        sx={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "20vw",
          width: "20vw",
          // maxWidth: 360,
          height: "100%",
          overflow: "hidden",
          p: 1,
        }}
      >
        <Box
          display={"flex"}
          flexDirection={"column"}
          gap={1}
          width="100%"
          height="100%"
          overflow="auto"
        >
          <Box display={"flex"} justifyContent={"center"} mb={1}>
            <Typography variant="h5" fontWeight={"bold"} color="primary.dark">
              Dynamic Tours
            </Typography>
          </Box>

          {/* Tour Search Bar */}
          <FormControl>
            <TextField
              size="small"
              placeholder="Search Tour"
              value={searchItem}
              // onFocus={() => setSearchItem("")}
              onChange={handleTourSearch}
              disabled={false}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </FormControl>

          <List disablePadding sx={{ ...scrollStyles(theme) }}>
            {dynamicTourList.map((tour) => (
              <>
                <ListItem
                  disablePadding
                  key={tour.tour_name}
                  sx={
                    selectedTour?.id === tour.id
                      ? {
                          display: "flex",
                          flexDirection: "column",
                          border: "1px solid #ccc",
                          borderRadius: 2,
                          marginBottom: 1,
                          backgroundColor: "#f0f0f0",
                        }
                      : undefined
                  }
                >
                  <ListItemButton
                    onClick={() => handleTourSelect(tour)}
                    sx={{
                      padding: 1,
                      width: "100%",
                      borderRadius: 2,
                      ...(selectedTour?.id === tour.id
                        ? {
                            backgroundColor: "#f0f0f0",
                            cursor: "pointer",
                          }
                        : {
                            marginBottom: 1,
                            border: "1px solid #ccc",
                            backgroundColor: "#fff",
                          }),
                    }}
                  >
                    <Stack spacing={1} width={"100%"}>
                      <Stack direction="row" spacing={1}>
                        <Chip
                          sx={{
                            height: 27,
                            width: 15,
                            bgcolor:
                              (tour.warehouse_colorCode as any) || "error",
                          }}
                        />

                        <Typography sx={{ fontSize: "1.1rem" }}>
                          {tour.tour_name}
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
                          label={`BKW 35`}
                          color="warning"
                          variant="outlined"
                        />
                        <XChip
                          label={`Pick-ups 3`}
                          color="#777"
                          variant="outlined"
                        />
                        <Stack direction="row" spacing={1}>
                          <XChip
                            label={`C: ${new Date(tour.created_at!).toLocaleDateString()}`}
                            color="warning"
                            variant="outlined"
                          />
                          {tour.updated_by && tour.updated_at && (
                            <XChip
                              label={`M: ${tour.updated_by.split("@")[0]} - ${new Date(tour.updated_at).toLocaleDateString()}`}
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      </Stack>
                    </Stack>
                  </ListItemButton>

                  {selectedTour?.id === tour.id && (
                    <Box
                      display={"flex"}
                      flexDirection={"column"}
                      gap={1}
                      px={1}
                      sx={{
                        width: "100%",
                        // height: 200,
                      }}
                    >
                      <Divider />
                      <IconButton
                        onClick={() => setExpandDetailsPanel((prev) => !prev)}
                        sx={{
                          my: 1,
                          py: 1,
                          bgcolor: "#999",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          height: "30px",
                          width: "17px",
                          position: "absolute",
                          right: -4,
                          p: 0,
                          m: 0,
                        }}
                      >
                        <ArrowRightIcon />
                      </IconButton>
                      {/* Total Avgs. */}
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          "& .MuiTypography-root": { fontSize: fontsize },
                        }}
                      >
                        <span>
                          <Typography>Total Weight</Typography>
                          <Typography>227.5 kg</Typography>
                        </span>
                        {/* <Typography>Total Weight 227.5 kg</Typography> */}
                        <Divider orientation="vertical" flexItem />
                        <span>
                          <Typography>Total Distance</Typography>
                          <Typography>850 km</Typography>
                        </span>
                        {/* <Typography>Total Distance 850 km</Typography> */}
                        <Divider orientation="vertical" flexItem />
                        <span>
                          <Typography>Total Duration</Typography>
                          <Typography>9.25 hrs</Typography>
                        </span>
                        {/* <Typography>Total Duration 9.25 hrs</Typography> */}
                      </Stack>

                      <Divider />
                      <Box
                        display={"flex"}
                        justifyContent={"space-between"}
                        gap={1}
                      >
                        <span>
                          <Typography variant="subtitle2" fontWeight={"bold"}>
                            Total Cost:
                          </Typography>
                          <Typography variant="subtitle2">Є 2500</Typography>
                        </span>
                        <Stack
                          spacing={0.2}
                          sx={{
                            "& .MuiTypography-root": {
                              fontSize: fontsize,
                            },
                          }}
                        >
                          <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                          >
                            <Typography>Cost / Stop:</Typography>
                            <Typography>250</Typography>
                          </Box>
                          <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                          >
                            <Typography>Cost / BKW:</Typography>
                            <Typography>80</Typography>
                          </Box>
                          <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                          >
                            <Typography>Cost / SLMD:</Typography>
                            <Typography>15</Typography>
                          </Box>
                        </Stack>
                        <Stack spacing={0.2}>
                          <FileDownloadDone
                            fontSize={"medium"}
                            color="success"
                          />
                          <SwipeDownAlt fontSize={"medium"} color="error" />
                          <SwipeUpAlt fontSize={"medium"} color="warning" />
                          <ImportExport fontSize={"medium"} color="info" />
                        </Stack>
                      </Box>
                      <Divider />
                    </Box>
                  )}
                </ListItem>
              </>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Right Panel: Tour Insights */}
      {expandDetailsPanel && selectedTour && (
        <Paper
          elevation={2}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            width: "15vw",
            height: "100%",
            overflow: "auto",
            py: 1,
            px: 2,
            ...scrollStyles(theme),
          }}
        >
          <Typography
            variant="h6"
            fontWeight="bold"
            color={"primary.dark"}
            textAlign={"center"}
            gutterBottom
          >
            Insights Pane
          </Typography>
          <Typography variant="subtitle1" fontWeight={"bold"}>
            {selectedTour.tour_name}-60-53-50-70
          </Typography>
          {/* Duration */}
          <Box
            display={"flex"}
            justifyContent={"space-between"}
            alignItems="flex-start"
          >
            <span>
              <Typography variant="subtitle2" fontWeight={"bold"}>
                Duration
              </Typography>
              <Typography variant="subtitle1">9.25 hrs</Typography>
            </span>

            <Paper elevation={1}>
              <Typography
                fontSize={fontsize}
                sx={{
                  border: "1px solid",
                  borderColor: "grey.400",
                  borderRadius: 1,
                  px: 1,
                  py: 0.25,
                }}
              >
                Day(s): 1
              </Typography>
            </Paper>
          </Box>
          {/* Solar Panels Qty/Wt*/}
          <Box display={"flex"} flexDirection={"column"}>
            <Typography variant="subtitle2" fontWeight={"bold"}>
              Solar Panels
            </Typography>

            <Table
              size="small"
              sx={{
                "& td": { fontSize: fontsize, px: 0.5 },
              }}
            >
              <TableRow>
                <TableCell align="left">Article</TableCell>
                <TableCell align="center">Qty</TableCell>
                <TableCell align="center">Wt / kg</TableCell>
              </TableRow>
              <TableBody>
                {/* {ItemRows.map((row, idx) => ( */}
                <TableRow key={0}>
                  <Tooltip
                    title="1 x SLMDL415 = 5.5kg"
                    placement="top-start"
                    arrow
                  >
                    <TableCell align="left">
                      {/* {row.article} */}
                      SLMDL415
                    </TableCell>
                  </Tooltip>
                  <TableCell align="center">
                    {/* {row.quantity} */}
                    25
                  </TableCell>
                  <TableCell align="center">
                    {/* {row.quantity} */}
                    137.5
                  </TableCell>
                </TableRow>
                <TableRow key={0}>
                  <Tooltip
                    title="1 x SLMDL415 = 5.0kg"
                    placement="top-start"
                    arrow
                  >
                    <TableCell align="left">
                      {/* {row.article} */}
                      SLMDL400
                    </TableCell>
                  </Tooltip>
                  <TableCell align="center">
                    {/* {row.quantity} */}
                    28
                  </TableCell>
                  <TableCell align="center">
                    {/* {row.quantity} */}
                    140
                  </TableCell>
                </TableRow>
                {/* total */}
                <TableRow key={0}>
                  <TableCell align="left" sx={{ fontWeight: "bold" }}>
                    {/* {row.article} */}
                    Total
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    {/* {row.quantity} */}
                    53
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    {/* {row.quantity} */}
                    227.5
                  </TableCell>
                </TableRow>
                {/* ))} */}
              </TableBody>
            </Table>
          </Box>
          {/* Cost Breakdown */}
          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={"bold"}>
              Cost Breakdown
            </Typography>
            {SideHeaderTable()}
          </Stack>

          {/* Section End */}
        </Paper>
      )}
    </Box>
  );
};

export default DynamicTourList;

export function SideHeaderTable() {
  const headers = [
    "Cost/Stop",
    "Cost/BKW",
    "Cost/SLMD",
    "Van Tour",
    "Diesel Tour",
    "Personal Tour",
    "Warehouse Tour",
    "Infeed Tour",
    "Hotel",
    "WE Tour",
    "WA Tour",
  ];

  const dataSet = [225, 850, 12, 65, 65, 65, 65, 65, 65, 65, 65];
  return (
    <TableContainer>
      <Table
        aria-label="side header table"
        size="small"
        sx={{
          "& td": { fontSize: "0.8rem", px: 0.5 },
          "& th": { fontSize: "0.8rem", fontWeight: "bold" },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell />
            {/* {rows.map((row) => (
              <TableCell key={row.name} align="center">
                {row.name}
              </TableCell>
            ))} */}
            <TableCell align="center">(Є)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {headers.map((header, i) => (
            <TableRow key={header}>
              {/* Header in the first column */}
              <TableCell component="th" scope="row" align="left">
                {header}
              </TableCell>
              {/* Values for each row */}
              {/* const values = [row.calories, row.fat, row.carbs, row.protein]; */}
              <TableCell align="center">{dataSet[i]}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell component="th" scope="row" align="left">
              Total
            </TableCell>
            <TableCell align="center">Є 2500</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
