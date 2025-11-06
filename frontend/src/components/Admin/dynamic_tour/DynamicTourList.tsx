import { ChangeEvent, useEffect, useState } from "react";
import Box from "@mui/material/Box/Box";
import {
  Chip,
  FormControl,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Modal,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import FileUploadIcon from "@mui/icons-material/FileUpload";
import CloseIcon from "@mui/icons-material/Close";

import { DynamicTourPayload } from "../../../types/tour.type";
import useDynamicTourStore from "../../../store/useDynamicTourStore";
import XChip from "../../base-ui/XChip";
import { scrollStyles } from "../../../theme";
import { useDynamicTourService } from "../../../hooks/useDynamicTourService";
import OrdersUpload from "./OrdersUpload";
import DynamicTourDetails from "./DynamicTourDetails";

const DynamicTourList = () => {
  const { theme } = useDynamicTourService();
  const { dynamicToursList, selectedTour, setSelectedTour } =
    useDynamicTourStore();

  const [selectedTourItem, setSelectedTourItem] = useState(selectedTour);
  const [searchItem, setSearchItem] = useState("");
  const [filteredTours, setFilteredTours] = useState<DynamicTourPayload[]>([]);

  // const [expandDetailsPanel, setExpandDetailsPanel] = useState(false);
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

  return (
    <>
      <Box display="flex" gap={0} height="100%">
        {selectedTour ? (
          <DynamicTourDetails />
        ) : (
          <Paper
            elevation={2}
            sx={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "20vw",
              width: "20vw",
              height: "100%",
              overflow: "hidden",
              p: 1,
              pt: selectedTour ? 0 : 1,
            }}
          >
            <Box
              display={"flex"}
              flexDirection={"column"}
              gap={1}
              width="100%"
              height="100%"
              overflow="hidden"
            >
              <Box
                display={"flex"}
                justifyContent={"center"}
                mb={1}
                sx={{ position: "relative" }}
              >
                <Typography
                  variant="h5"
                  fontWeight={"bold"}
                  color="primary.dark"
                >
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
                {filteredTours.map((tour, idx) => (
                  <>
                    <ListItem
                      disablePadding
                      key={"id: " + idx + tour.id!}
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
                          <Box
                            display={"flex"}
                            justifyContent={"space-between"}
                          >
                            <Stack direction="row" spacing={1}>
                              <Chip
                                sx={{
                                  height: 27,
                                  width: 15,
                                  bgcolor:
                                    (tour.warehouse_colorCode as any) ||
                                    "error",
                                }}
                              />

                              <Typography sx={{ fontSize: "1.1rem" }}>
                                {tour.tour_name}
                              </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: "1rem" }}>
                              {tour.warehouse_town}
                            </Typography>
                          </Box>

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
                              label={`Menge ${tour.matrix?.totalOrdersItemsQty}`}
                              color="success"
                              variant="outlined"
                            />
                            <XChip
                              label={`BKW ${tour.matrix?.totalOrdersArticlesQty}`}
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
                    </ListItem>
                  </>
                ))}
              </List>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Upload Orders */}
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
