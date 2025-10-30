import { ChangeEvent, useEffect, useState } from "react";
import Box from "@mui/material/Box/Box";
import {
  Chip,
  Divider,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Modal,
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
import FileDownloadDoneIcon from "@mui/icons-material/FileDownloadDone";
import SwipeUpAltIcon from "@mui/icons-material/SwipeUpAlt";

import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import ArrowLeftIcon from "@mui/icons-material/ArrowLeft";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import CloseIcon from "@mui/icons-material/Close";

import { DynamicTourPayload } from "../../../types/tour.type";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import XChip from "../../base-ui/XChip";
import { scrollStyles } from "../../../theme";
import { useDynamicTourService } from "../../../hooks/useDynamicTourService";
import OrdersUpload from "./OrdersUpload";

const DynamicTourList = () => {
  const fontsize = "0.95rem";
  const { theme } = useDynamicTourService();
  const { dynamicToursList, selectedTour, setSelectedTour } =
    useDynamicTourStore();

  const [selectedTourItem, setSelectedTourItem] = useState(selectedTour);
  const [searchItem, setSearchItem] = useState("");
  const [filteredTours, setFilteredTours] = useState<DynamicTourPayload[]>([]);

  const [expandDetailsPanel, setExpandDetailsPanel] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    setFilteredTours(dynamicToursList);
    setSearchItem("");
  }, [dynamicToursList]);

  useEffect(() => {
    setSelectedTourItem(selectedTour);
  }, [selectedTour]);

  const handleTourSelect = (tour: DynamicTourPayload) => {
    if (tour.id === selectedTourItem?.id) {
      setSelectedTour(null);
      return;
    } else {
      setSelectedTour(tour);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const searchString = searchItem.trim().toLowerCase();

      if (!searchString) {
        setFilteredTours(dynamicToursList);
        return;
      }

      const resultArray = dynamicToursList.filter(
        (t) =>
          t.tour_name?.toLowerCase().includes(searchString) ||
          t.warehouse_name?.toLowerCase().includes(searchString) ||
          t.warehouse_town?.toLowerCase().includes(searchString)
      );

      setFilteredTours(resultArray.length > 0 ? resultArray : dynamicToursList);
    }, 300); // 300ms

    return () => clearTimeout(handler);
  }, [searchItem, dynamicToursList]);

  const handleTourSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchItem(e.target.value);
  };

  const extractOrdersLength = (orderIds: string) => {
    return orderIds.split(",").length;
  };

  enum CostType {
    Stop = "stop",
    Article = "article",
    Slmd = "slmd",
  }
  const costEvaluator = (value: number, costType: CostType) => {
    const tourStops = selectedTour?.orderIds.split(",").length ?? 0;
    const costRules = {
      [CostType.Stop]: {
        valid: (v: number, s: number) =>
          (v > 0 && v <= 20 && s > 10) || (v > 0 && v <= 140 && s <= 6),
        warning: (v: number, s: number) =>
          (v < 25 && s > 10) || (v < 140 && s <= 6),
      },
      [CostType.Article]: {
        valid: (v: number, s: number) =>
          (v > 0 && v <= 10 && s > 10) || (v > 0 && v <= 15 && s <= 6),
        warning: (v: number, s: number) =>
          (v < 25 && s > 10) || (v < 50 && s <= 6),
      },
      [CostType.Slmd]: {
        valid: (v: number) => v > 0 && v <= 3.5,
        warning: (v: number) => v <= 6,
      },
    } as const;

    const getIcon = (color: "success" | "warning" | "error") => {
      switch (color) {
        case "success":
          return <FileDownloadDoneIcon fontSize="medium" color="success" />;
        case "warning":
          return <SwipeUpAltIcon fontSize="medium" color="warning" />;
        case "error":
          return <SwipeUpAltIcon fontSize="medium" color="error" />;
      }
    };

    const rule = costRules[costType];
    if (!rule) return null;

    const valid = rule.valid(value, tourStops);
    const warning = rule.warning(value, tourStops);

    if (valid) return getIcon("success");
    if (warning) return getIcon("warning");
    return getIcon("error");
  };

  return (
    <>
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
            <Box
              display={"flex"}
              justifyContent={"center"}
              mb={1}
              sx={{ position: "relative" }}
            >
              <Typography variant="h5" fontWeight={"bold"} color="primary.dark">
                Dynamic Tours
              </Typography>
              <IconButton
                onClick={() => setShowUploadModal(true)}
                sx={{
                  position: "absolute",
                  right: -10,
                  zIndex: 10,
                  color: theme.palette.primary.dark,
                }}
              >
                <FileUploadIcon />
              </IconButton>
            </Box>

            {/* Tour Search Bar */}
            <FormControl>
              <TextField
                size="small"
                placeholder="Search Tour..."
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
              {filteredTours.map((tour) => (
                <>
                  <ListItem
                    disablePadding
                    key={tour.id}
                    sx={
                      selectedTourItem?.id === tour.id
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
                        ...(selectedTourItem?.id === tour.id
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
                            label={`Ziele ${extractOrdersLength(tour.orderIds)}`}
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

                    {selectedTourItem?.id === tour.id && (
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
                            <Typography>
                              {tour?.matrix?.total_weight_kg ?? "---"}
                            </Typography>
                          </span>
                          {/* <Typography>Total Weight 227.5 kg</Typography> */}
                          <Divider orientation="vertical" flexItem />
                          <span>
                            <Typography>Total Distance</Typography>
                            <Typography>
                              {tour?.matrix?.total_distance_km ?? "---"}
                            </Typography>
                          </span>
                          {/* <Typography>Total Distance 850 km</Typography> */}
                          <Divider orientation="vertical" flexItem />
                          <span>
                            <Typography>Total Duration</Typography>
                            <Typography>
                              {tour?.matrix?.total_duration_hrs ?? "---"}
                            </Typography>
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
                            <Typography variant="subtitle2">
                              Є {tour?.matrix?.total_cost ?? "---"}
                            </Typography>
                          </span>
                          <Stack
                            minWidth={"50%"}
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
                              <Typography>
                                {tour?.matrix?.delivery_cost_per_stop ?? "---"}
                              </Typography>
                            </Box>
                            <Box
                              display={"flex"}
                              justifyContent={"space-between"}
                            >
                              <Typography>Cost / Article:</Typography>
                              <Typography>
                                {tour?.matrix?.delivery_cost_per_bkw ?? "---"}
                              </Typography>
                            </Box>
                            <Box
                              display={"flex"}
                              justifyContent={"space-between"}
                            >
                              <Typography>Cost / SLMD:</Typography>
                              <Typography>
                                {tour?.matrix?.delivery_cost_per_slmd ?? "---"}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack spacing={0.2}>
                            {tour?.matrix?.delivery_cost_per_stop &&
                              costEvaluator(
                                tour?.matrix?.delivery_cost_per_stop,
                                CostType.Stop
                              )}
                            {tour?.matrix?.delivery_cost_per_bkw &&
                              costEvaluator(
                                tour?.matrix?.delivery_cost_per_bkw,
                                CostType.Article
                              )}
                            {tour?.matrix?.delivery_cost_per_slmd &&
                              costEvaluator(
                                tour?.matrix?.delivery_cost_per_slmd,
                                CostType.Slmd
                              )}
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
        {expandDetailsPanel && selectedTourItem && (
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
              {selectedTourItem.tour_name}
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
                <Typography variant="subtitle1">
                  {selectedTourItem.matrix?.total_duration_hrs ?? "---"} hrs
                </Typography>
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
              {SideHeaderTable(selectedTourItem)}
            </Stack>

            {/* Section End */}
          </Paper>
        )}
      </Box>
      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        aria-labelledby="orders-upload-modal"
        aria-describedby="orders-upload-form"
      >
        <Box
          sx={{
            position: "absolute",
            top: "7%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "70%",
            maxWidth: 500,
            borderRadius: 2,
            boxShadow: 24,
            bgcolor: "background.paper",
            overflow: "hidden",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            bgcolor={theme.palette.primary.dark}
            color="white"
            pl={2}
            pr={1}
            py={1}
          >
            <Typography id="orders-upload-modal" variant="h6" fontWeight="bold">
              Upload Orders
            </Typography>
            <IconButton
              onClick={() => setShowUploadModal(false)}
              sx={{ color: "white", m: 0, p: 0 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box p={2}>
            <OrdersUpload />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DynamicTourList;

export function SideHeaderTable(tour: DynamicTourPayload) {
  const headers = [
    "Cost/Stop",
    "Cost/BKW",
    "Cost/SLMD",
    "Vehicle/Van",
    "Diesel",
    "Personnel",
    "Warehouse",
    "Infeed",
    "Hotel",
    "WE Tour",
    "WA Tour",
  ];

  console.log("selectedTour.matrix: ", tour.matrix);

  const dataSet = [
    tour.matrix?.delivery_cost_per_stop,
    tour.matrix?.delivery_cost_per_bkw,
    tour.matrix?.delivery_cost_per_slmd,
    tour.matrix?.van_tour_cost,
    tour.matrix?.diesel_tour_cost,
    tour.matrix?.personnel_tour_cost,
    tour.matrix?.warehouse_tour_cost,
    tour.matrix?.infeed_tour_cost,
    tour.matrix?.hotel_cost,
    tour.matrix?.we_tour_cost,
    tour.matrix?.wa_tour_cost,
  ];
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
              <TableCell align="center">{dataSet[i]}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell component="th" scope="row" align="left">
              Total
            </TableCell>
            <TableCell align="center">Є {tour.matrix?.total_cost}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
