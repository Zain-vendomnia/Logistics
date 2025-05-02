import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Stack, TextField, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, InputAdornment, OutlinedInput, Typography
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WarehouseOutlinedIcon from "@mui/icons-material/WarehouseOutlined";
import { getAllWarehouses } from "../../services/warehouseService";

type Driver = {
  id: number;
  name: string;
  mob: string;
  address: string;
  warehouse_id: number;
};

type Warehouse = {
  warehouse_id: number;
  warehouse_name: string;
};

type Props = {
  open: boolean;
  editMode: boolean;
  formData: Partial<Driver>;
  errors: { [key: string]: string };
  onChange: (field: keyof Driver, value: string | number) => void;
  onClose: () => void;
  onSave: () => void;
};

const DriverDialog: React.FC<Props> = ({
  open, editMode, formData, errors, onChange, onClose, onSave
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchWarehouses = async () => {
      setLoading(true);
      try {
        const data = await getAllWarehouses();
        setWarehouses(data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWarehouses();
  }, [open]);

  const renderTextField = (
    label: string,
    field: keyof Driver,
    icon: React.ReactNode,
    multiline = false,
    autoFocus = false
  ) => (
    <TextField
      label={label}
      fullWidth
      autoFocus={autoFocus}
      multiline={multiline}
      variant="outlined"
      value={formData[field] || ""}
      onChange={(e) => onChange(field, e.target.value)}
      error={!!errors[field]}
      helperText={errors[field]}
      InputProps={{
        startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
      }}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" align="center">
          {editMode ? "Edit Driver" : "Add Driver"}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
          Please fill in the details carefully
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack alignItems="center" py={4}>
            <CircularProgress />
            <Typography mt={2}>Loading warehouses...</Typography>
          </Stack>
        ) : (
          <Stack spacing={2} mt={1} minWidth={350}>
            {renderTextField("Driver Name", "name", <PersonOutlineIcon sx={{ color: "black" }} />, false, true)}
            {renderTextField("Mobile", "mob", <PhoneAndroidIcon sx={{ color: "black" }} />)}
            {renderTextField("Address", "address", <HomeOutlinedIcon sx={{ color: "black" }} />, true)}

            <FormControl fullWidth error={!!errors.warehouse_id}>
              <InputLabel id="warehouse-label">Warehouse</InputLabel>
              <Select
                labelId="warehouse-label"
                value={formData.warehouse_id || ""}
                onChange={(e) => onChange("warehouse_id", Number(e.target.value))}
                input={
                  <OutlinedInput
                    label="Warehouse"
                    startAdornment={
                      <InputAdornment position="start">
                        <WarehouseOutlinedIcon sx={{ color: "black" }} />
                      </InputAdornment>
                    }
                  />
                }
              >
                <MenuItem value="">
                  <em>Select warehouse</em>
                </MenuItem>
                {warehouses.map(({ warehouse_id, warehouse_name }) => (
                  <MenuItem key={warehouse_id} value={warehouse_id}>
                    {warehouse_name} - {warehouse_id}
                  </MenuItem>
                ))}
              </Select>
              {errors.warehouse_id && (
                <Typography color="error" variant="caption" mt={0.5}>
                  {errors.warehouse_id}
                </Typography>
              )}
            </FormControl>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button onClick={onSave} variant="contained" sx={{ borderRadius: 2 }} disabled={loading}>
          {editMode ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriverDialog;
