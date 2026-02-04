// TourTable.tsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Checkbox,
  Button,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
  Chip,
  useTheme,
} from "@mui/material";
import { MoreVert, Delete, FileDownload, Merge } from "@mui/icons-material";
import ViewPicklistModal from "./Admin_ViewPicklistModal";
import { exportTours } from "./AdminServices/tourExportServices";
import { TourRow } from "../../types/tour.type";

export interface RowAction {
  key?: string;
  label: string;
  onClick: (tour: TourRow) => void;
}

export interface ActionButtonProps<T = any> {
  title: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "error" | "info";
  sx?: object;
  onClick: (selected: T[]) => void;
}
export const ActionButton = <T,>({
  title,
  icon,
  onClick,
  color,
  disabled,
  sx,
  selected,
}: ActionButtonProps<T> & { selected: T[] }) => (
  <Tooltip title={title}>
    <span>
      <Button
        variant="contained"
        color={color}
        startIcon={icon}
        size="small"
        onClick={() => onClick(selected)}
        disabled={disabled}
        sx={sx}
      >
        {title}
      </Button>
    </span>
  </Tooltip>
);

interface Props {
  title: string; // "Page title"
  tours: TourRow[];
  detailsUrl: string;
  onLoadTours: () => Promise<void>;
  onNodeClick: (tour: TourRow) => void;
  extraActions?: ActionButtonProps[];
  rowActions?: RowAction[];
}

const SpecTable = ({
  title,
  tours,
  detailsUrl,
  onLoadTours,
  onNodeClick,
  extraActions,
  rowActions,
}: Props) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [currentTour, setCurrentTour] = useState<TourRow | null>(null);
  const [viewPicklistModalOpen, setViewPicklistModalOpen] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as any,
  });

  const showSnackbar = (message: string, severity: any) =>
    setSnackbar({ open: true, message, severity });

  const filteredTours = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tours.filter((t) =>
      [t.tour_name, t.driver_name, t.tour_date, t.id.toString()].some(
        (f) => f && f.toLowerCase().includes(term),
      ),
    );
  }, [tours, searchTerm]);

  const handleSelect = (id: number) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((i) => i !== id) : [...s, id],
    );

  const handleAction = async (action: "delete" | "merge" | "export") => {
    if (!selected.length) return showSnackbar("No tours selected", "warning");
    try {
      // if (action === "delete") return handleDelete(selected);
      if (action === "merge")
        return selected.length === 2
          ? showSnackbar("Merge not implemented", "info")
          : showSnackbar("Select 2 tours to merge", "warning");
      if (action === "export") {
        await exportTours(selected.map(String));
        showSnackbar(`Exported ${selected.length} tour(s)`, "success");
      }
    } catch {
      showSnackbar(`${action} failed`, "error");
    }
  };

  const theme = useTheme();

  return (
    <Box p={2}>
      <Card sx={{ borderRadius: 4, boxShadow: 3 }}>
        <CardHeader title={title} sx={{ bgcolor: "#1976d2", color: "white" }} />
        <CardContent>
          <Box
            display="flex"
            justifyContent="space-between"
            flexWrap="wrap"
            mb={2}
            gap={2}
          >
            <TextField
              placeholder="Search tours..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ maxWidth: 300 }}
            />
            <Box display="flex" gap={1}>
              {extraActions &&
                extraActions.map((btn, idx) => (
                  <ActionButton
                    key={idx}
                    {...btn}
                    disabled={!selected.length}
                    selected={selected.map(String)}
                  />
                ))}

              <ActionButton
                title="Export"
                icon={<FileDownload />}
                color="primary"
                onClick={() => handleAction("export")}
                disabled={!selected.length}
                selected={selected}
                sx={{
                  background: selected.length
                    ? theme.palette.primary.gradient
                    : undefined,
                }}
              />
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f0f0f0" }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selected.length > 0 &&
                      selected.length < filteredTours.length
                    }
                    checked={
                      filteredTours.length > 0 &&
                      selected.length === filteredTours.length
                    }
                    onChange={(e) =>
                      setSelected(
                        e.target.checked ? filteredTours.map((t) => t.id) : [],
                      )
                    }
                  />
                </TableCell>
                {["Name", "Driver", "Start Time"].map((h) => (
                  <TableCell key={h}>
                    <strong>{h}</strong>
                  </TableCell>
                ))}
                {
                  <TableCell align="right">
                    <strong>Actions</strong>
                  </TableCell>
                }
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTours.length ? (
                filteredTours.map((tour) => {
                  const isChecked = selected.includes(tour.id);
                  return (
                    <TableRow key={tour.id} hover selected={isChecked}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isChecked}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelect(tour.id);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip
                            sx={{
                              width: 10,
                              height: 15,
                              bgcolor: tour.warehouse_colorCode,
                            }}
                          />
                          <Box
                            onClick={
                              () => onNodeClick(tour)
                              // () => navigate(`${detailsUrl + tour.id}`)
                              //   navigate(`/tours/TourType/${tour.id}`)
                            }
                            sx={{
                              wordWrap: "break-word",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              cursor: "pointer",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            <strong>{tour.tour_name}</strong>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{tour.driver_name}</TableCell>
                      <TableCell>
                        {new Date(tour.tour_date)
                          .toLocaleTimeString()
                          .slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        <Box
                          display="flex"
                          gap={1}
                          sx={{ justifyContent: "flex-end" }}
                        >
                          {/* {rowActions ? rowActions : null} */}

                          <IconButton
                            onClick={(e) => {
                              setAnchorEl(e.currentTarget);
                              setCurrentTour(tour);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No tours found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setViewPicklistModalOpen(true);
            setAnchorEl(null);
          }}
        >
          View Picklist
        </MenuItem>
        <Divider />

        {rowActions &&
          rowActions.map(
            (action, idx) =>
              action && (
                <MenuItem
                  key={action.key || idx}
                  onClick={() => {
                    currentTour && action.onClick(currentTour);
                    setAnchorEl(null);
                  }}
                >
                  {action.label}
                </MenuItem>
              ),
          )}
      </Menu>

      <ViewPicklistModal
        open={viewPicklistModalOpen}
        handleClose={() => setViewPicklistModalOpen(false)}
        tourId={currentTour && currentTour?.id}
        onSendEmail={(success) => {
          if (success) {
            showSnackbar("Email Sent Successfully!", "success");
            setViewPicklistModalOpen(false);
          } else {
            showSnackbar("Error sending email!", "error");
          }
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SpecTable;
