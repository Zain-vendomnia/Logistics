import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Grid, Typography, Box
} from "@mui/material";
import {
  Warehouse as WarehouseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon
} from "@mui/icons-material";

type Warehouse = {
  warehouse_id?: number;
  warehouse_name: string;
  clerk_name: string;
  clerk_mob: string;
  address: string;
  email: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Warehouse>) => Promise<void>;
  initialData: Partial<Warehouse>;
  editMode: boolean;
}

const WarehouseFormModal: React.FC<Props> = ({
  open, onClose, onSubmit, initialData, editMode
}) => {
  const [form, setForm] = useState<Partial<Warehouse>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(initialData);
    setErrors({});
  }, [initialData, open]);

  const handleChange = (field: keyof Warehouse) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.warehouse_name) e.warehouse_name = "Warehouse name is required";
    else if (!/^[A-Za-z\s]+$/.test(form.warehouse_name)) e.warehouse_name = "Warehouse name must contain only letters";
    if (!form.clerk_name) e.clerk_name = "Clerk name is required";
    if (!form.clerk_mob) e.clerk_mob = "Clerk mobile is required";
    else if (!/^\+?\d{7,15}$/.test(form.clerk_mob)) e.clerk_mob = "Enter valid mobile number (7–15 digits, optional +)";
    if (!form.email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email format";
    if (!form.address) e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm({});
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const isFormFilled = form.warehouse_name && form.clerk_name && form.clerk_mob && form.email && form.address;

  const renderField = (
    label: string,
    field: keyof Warehouse,
    icon: React.ReactNode,
    props: any = {}
  ) => (
    <TextField
      fullWidth
      variant="outlined"
      label={label}
      value={form[field] || ""}
      onChange={handleChange(field)}
      error={!!errors[field]}
      helperText={errors[field]}
      InputProps={{
        startAdornment: (
          <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        ),
        ...props.inputProps
      }}
      {...props}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, fontSize: "1.5rem", textAlign: "center" }}>
        {editMode ? "Edit Warehouse" : "Add New Warehouse"}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
          Please fill in the details carefully
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {renderField("Warehouse Name", "warehouse_name", <WarehouseIcon />, { autoFocus: true })}
          </Grid>
          <Grid item xs={12} sm={6}>
            {renderField("Clerk Name", "clerk_name", <PersonIcon />)}
          </Grid>
          <Grid item xs={12} sm={6}>
            {renderField("Clerk Mobile", "clerk_mob", <PhoneIcon />, {
              inputProps: { maxLength: 16 }
            })}
          </Grid>
          <Grid item xs={12}>
            {renderField("Email", "email", <EmailIcon />)}
          </Grid>
          <Grid item xs={12}>
            {renderField("Address", "address", <HomeIcon />, {
              multiline: true,
              minRows: 2
            })}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{ borderRadius: 2 }}
          disabled={!isFormFilled || submitting}
        >
          {editMode ? "Update" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarehouseFormModal;
