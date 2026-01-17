import { useEffect, useState, useCallback } from "react";
import { Box, Typography, Button, Modal, Fade, Backdrop } from "@mui/material";
import { Delete, Merge } from "@mui/icons-material";

import { deleteTours } from "../AdminServices/tourDeletionServices";
import EditTourModal from "../Admin_EditTourModal";
import "../css/Admin_TourTemplate.css";
import adminApiService from "../../../services/adminApiService";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import { handlePermit } from "../../../utils/tourHelper";
import { TourRow, TourStatus } from "../../../types/tour.type";
import SpecTable, { ActionButtonProps, RowAction } from "../SpecTable";
import { useNavigate } from "react-router-dom";

const ScheduledTours = () => {
  const [tours, setTours] = useState<TourRow[]>([]);
  const [selectedTour, setSelectedTour] = useState<TourRow | null>(null);
  const [isOpenEditModal, setIsOpenEditModal] = useState(false);

  const [isOpenPeremitModal, setOpenPermitModal] = useState(false);
  const [permitTourIds, setPermitTourIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadTours = useCallback(async () => {
    try {
      const res = await adminApiService.fetchToursByStatus(
        TourStatus.completed
      );
      const toursRes = res.data as TourRow[];
      setTours(
        toursRes.map(
          (t): TourRow => ({
            id: t.id,
            tour_name: t.tour_name,
            status: t.status,
            tour_date: t.tour_date,
            route_color: t.route_color,
            comments: t.comments,
            orderIds: t.orderIds,
            driver_id: t.driver_id || 0,
            driver_name: t.driver_name || "N/A",
            vehicle_id: t.vehicle_id,
            warehouse_id: t.warehouse_id,
            warehouse_colorCode: t.warehouse_colorCode,
          })
        )
      );
    } catch (e) {
      console.error(e);
      // showSnackbar("Failed to load tours", "error");
    }
  }, []);

  useEffect(() => {
    loadTours();
  }, [loadTours]);

  const handleDelete = async (ids: string[]) => {
    try {
      debugger;
      await deleteTours(ids);
      await loadTours();
      // showSnackbar(`Deleted ${ids.length} tour(s)`, "success");
    } catch {
      // showSnackbar("Failed to delete tours", "error");
    }
  };

  const handleMerge = async (ids: string[]) => {
    try {
      await loadTours();
    } catch {
      // showSnackbar("Failed to delete tours", "error");
    }
  };

  const handleSendPermit = (tourIds: string[]) => {
    debugger;
    setPermitTourIds(tourIds);
    setOpenPermitModal(true);
  };

  const triggerPermitEmail = async () => {
    setLoading(true);

    try {
      // Send Logistics Email to Customer
      handlePermit(permitTourIds);
      // showSnackbar("Emails sent successfully", "success");
    } catch (error) {
      console.error("Error sending emails:", error);
      // showSnackbar("Failed to send emails", "error");
    } finally {
      // Close the modal after sending the emails
      setLoading(false);
      setOpenPermitModal(false);
      setPermitTourIds([]);
    }
  };

  const handleEditTour = (tour: TourRow) => {
    setSelectedTour(tour);
    setIsOpenEditModal(true);
  };

  const handleTourClick = (tour: TourRow) => {
    navigate(`/scheduled/tour/detail/${tour.id}`);
  };

  const rowActions: RowAction[] = [
    {
      key: "edit-details",
      label: "Edit Tour",
      onClick: handleEditTour,
    },
  ];

  const extraActions: ActionButtonProps[] = [
    {
      title: "Send Parking Permit",
      icon: null,
      onClick: handleSendPermit,
      color: "primary",
    },
    {
      title: "Delete",
      icon: <Delete />,
      onClick: handleDelete,
      color: "error",
    },
    {
      title: "Merge",
      icon: <Merge />,
      onClick: handleMerge,
      color: "info",
    },
  ];

  return (
    <>
      <SpecTable
        title={"Scheduled Tours"}
        tours={tours}
        detailsUrl="/scheduled/tour/detail/"
        onLoadTours={() => loadTours()}
        onNodeClick={handleTourClick}
        extraActions={extraActions}
        rowActions={rowActions}
      />

      <EditTourModal
        open={isOpenEditModal}
        handleClose={() => setIsOpenEditModal(false)}
        tourData={selectedTour}
        onTourUpdated={async () => {
          await loadTours();
        }}
      />

      <Modal
        open={isOpenPeremitModal}
        onClose={() => setOpenPermitModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={isOpenPeremitModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              minWidth: 300,
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 70, color: "#ef972e" }} />
            <Typography variant="h5" mt={2} mb={1}>
              Are you sure you want to send the parking permits?
            </Typography>
            <Typography variant="body1">
              This action cannot be undone.
            </Typography>
            <Box display="flex" justifyContent="center" gap={2} mt={3}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => setOpenPermitModal(false)}
              >
                No
              </Button>
              <Button
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={triggerPermitEmail}
              >
                {loading ? "Sending..." : "Yes"}
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

export default ScheduledTours;
