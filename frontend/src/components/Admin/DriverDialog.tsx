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
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { getAllWarehouses } from "../../services/warehouseService";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";


type Driver = {
  id: number;
  name: string;
  email: string;
  mob: string;
  address: string;
  warehouse_id: number;
  password?: string;
  status: number; // 1 = active, 0 = inactive
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
  const [passwordEditable, setPasswordEditable] = useState(!editMode);

  useEffect(() => {
    if (!open) return;
    setPasswordEditable(!editMode);

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
  }, [open, editMode]);

  const renderTextField = (
    label: string,
    field: keyof Driver,
    icon: React.ReactNode,
    multiline = false,
    autoFocus = false,
    disabled = false,
    highlight = false
  ) => (
    <TextField
      label={label}
      type={field === "password" ? "password" : "text"}
      fullWidth
      autoFocus={autoFocus}
      multiline={multiline}
      variant="outlined"
      value={formData[field] || ""}
      onChange={(e) => onChange(field, e.target.value)}
      error={!!errors[field]}
      helperText={errors[field]}
      autoComplete={field === "password" ? "new-password" : undefined}
      disabled={disabled}
      InputProps={{
        startAdornment: <InputAdornment position="start">{icon}</InputAdornment>,
        sx: {
          backgroundColor: disabled
            ? '#f0f0f0'
            : highlight
              ? '#fff9c4'
              : 'inherit',
          opacity: 1,
          color: 'rgba(0,0,0,0.87)',
          WebkitTextFillColor: 'rgba(0,0,0,0.87)'
        }
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
            {renderTextField("Email", "email", <EmailOutlinedIcon sx={{ color: "black" }} />)}
            {renderTextField("Mobile", "mob", <PhoneAndroidIcon sx={{ color: "black" }} />)}
            {renderTextField("Address", "address", <HomeOutlinedIcon sx={{ color: "black" }} />, true)}

            {/* Warehouse Dropdown */}
            <FormControl fullWidth error={!!errors.warehouse_id}>
              <InputLabel id="warehouse-label">Warehouse</InputLabel>
              <Select
                labelId="warehouse-label"
                value={formData.warehouse_id ?? ""}
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

           <FormControl fullWidth error={!!errors.status}>
  <InputLabel id="status-label">User Status</InputLabel>
  <Select
    labelId="status-label"
    value={formData.status ?? ""}
    onChange={(e) => onChange("status", Number(e.target.value))}
    input={
      <OutlinedInput
        label="User Status"
        startAdornment={
          <InputAdornment position="start">
            <CheckCircleOutlineIcon sx={{ color: "black" }} />
          </InputAdornment>
        }
      />
    }
  >
    <MenuItem value="">
      <em>Select status</em>
    </MenuItem>
    <MenuItem value={1}>
     
      Active
    </MenuItem>
    <MenuItem value={0}>
      
      Inactive
    </MenuItem>
  </Select>
  {errors.status && (
    <Typography color="error" variant="caption" mt={0.5}>
      {errors.status}
    </Typography>
  )}
</FormControl>

            {/* Password Field */}
            {passwordEditable && renderTextField(
              "Password",
              "password",
              <LockOutlinedIcon sx={{ color: "black" }} />,
              false,
              false,
              false,
              true
            )}

            {editMode && !passwordEditable && (
              <Button
                variant="text"
                size="small"
                onClick={() => setPasswordEditable(true)}
                sx={{ mt: 1, textTransform: 'none', fontWeight: 500 }}
              >
                Change Password
              </Button>
            )}

            {editMode && passwordEditable && (
              <Typography
                variant="body2"
                color="error"
                sx={{ ml: 0.5, fontWeight: 500 }}
              >
                Leave blank to keep current password.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" size="small" sx={(theme) => ({
          padding: '8px 24px',
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: '500',
          background: theme.palette.primary.gradient,
          color: "#fff",
          transition: "all 0.3s ease",
          "&:hover": {
            background: "#fff",
            color: theme.palette.primary.dark,
          }
        })}>
          Cancel
        </Button>
        <Button onClick={onSave} size="small" variant="outlined" disabled={loading} sx={(theme) => ({
          padding: '8px 24px',
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: '500',
          background: theme.palette.primary.gradient,
          color: "#fff",
          transition: "all 0.3s ease",
          "&:hover": {
            background: "#fff",
            color: theme.palette.primary.dark,
          }
        })}>
          {editMode ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DriverDialog;
