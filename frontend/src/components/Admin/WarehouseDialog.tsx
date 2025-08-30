import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, FormControlLabel, Switch,
  CircularProgress,Typography
} from "@mui/material";

type Warehouse = {
  warehouse_id?: number;
  warehouse_name: string;
  clerk_name: string;
  clerk_mob: string;
  address: string;
  email: string;
  is_active: number; // 1 for active, 0 for inactive
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Warehouse>) => Promise<void>;
  initialData: Partial<Warehouse>;
  editMode: boolean;
}

const WarehouseFormModal: React.FC<Props> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  editMode
}) => {
  const [formData, setFormData] = useState<Partial<Warehouse>>({ 
    warehouse_name: "",
    clerk_name: "",
    clerk_mob: "+49",
    address: "",
    email: "",
    is_active: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Form field configuration
  const formFields = [
    { name: "warehouse_name", label: "Warehouse Name", type: "text" },
    { name: "clerk_name", label: "Clerk Name", type: "text" },
    { name: "clerk_mob", label: "Clerk Mobile", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "address", label: "Address", type: "text", multiline: true }
  ];

  console.log("initialData", initialData);

  useEffect(() => {
    if (open) {
      setFormData({ 
        warehouse_name: "",
        clerk_name: "",
        clerk_mob: "+49",
        address: "",
        email: "",
        is_active: 1,
        ...initialData 
      });
      setErrors({});
    }
  }, [initialData, open]);

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    // Warehouse Name: required & only letters and spaces
    if (!editMode) {
      if (!formData.warehouse_name) {
        newErrors.warehouse_name = "Warehouse name is required";
      } else if (!/^[A-Za-z\s&.,'-]+$/.test(formData.warehouse_name)) {
        newErrors.warehouse_name = "Warehouse name contains invalid characters";
      }
    }

    // Clerk Name: required
    if (!formData.clerk_name) {
      newErrors.clerk_name = "Clerk name is required";
    }

    // Clerk Mobile: German format
    if (!formData.clerk_mob) {
      newErrors.clerk_mob = "Clerk mobile is required";
    } else if (!/^\+49\d{10,12}$/.test(formData.clerk_mob)) {
      newErrors.clerk_mob = "Enter valid German mobile number (starts with +49, 10–12 digits after)";
    }

    // Email: required and format check
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Address: required
    if (!formData.address) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      handleDialogClose();
    } catch (error) {
      console.error("Error saving warehouse:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDialogClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="sm">
      <DialogTitle>
          <Typography variant="h6" align="center">
          {editMode ? "Edit Warehouse" : "Add Warehouse"}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={2}>
          Please fill in the details carefully
        </Typography>
        {/* {editMode ? "Edit Warehouse" : "Add Warehouse"} */}
        
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} mt={1}>
          {/* Regular form fields */}
         {formFields.map(({ name, label, type = "text", multiline }) => {
  // Custom styling for disabled warehouse name field
  if (name === "warehouse_name" && editMode) {
    return (
      <div key={name} style={{ marginBottom: '16px' }}>
        <TextField
          label={label}
          type={type}
          value={formData[name as keyof Warehouse] ?? ""}
          disabled={true}
          multiline={multiline}
          rows={multiline ? 3 : undefined}
          fullWidth
          sx={{
            '& .MuiInputBase-root': {
              backgroundColor: '#f8f9fa',
              border: '2px solid #e9ecef',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#dee2e6',
              },
            },
            '& .MuiInputBase-input': {
              color: '#6c757d',
              fontWeight: '500',
              fontSize: '14px',
            },
            '& .MuiInputLabel-root': {
              color: '#6c757d',
              fontWeight: '500',
              '&.Mui-focused': {
                color: '#6c757d',
              },
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '& .MuiInputBase-root.Mui-disabled': {
              backgroundColor: '#f8f9fa',
              '& .MuiInputBase-input': {
                WebkitTextFillColor: '#6c757d',
              },
            },
          }}
        />
        <div style={{
          marginTop: '4px',
          marginLeft: '14px',
          fontSize: '12px',
          color: '#ff6b35',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: '#ff6b35',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold'
          }}>!</span>
          Warehouse name cannot be edited
        </div>
      </div>
    );
  }

  // Regular fields
  return (
    <TextField
      key={name}
      label={label}
      type={type}
      value={formData[name as keyof Warehouse] ?? ""}
      error={!!errors[name]}
      helperText={errors[name]}
      multiline={multiline}
      rows={multiline ? 3 : undefined}
      onChange={(e) => handleFieldChange(name, e.target.value)}
      inputProps={name === "clerk_mob" ? { maxLength: 16 } : undefined}
      sx={{
        '& .MuiInputBase-root': {
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ff6b35',
          },
        },
        '& .MuiInputLabel-root.Mui-focused': {
          color: '#ff6b35',
        },
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#ff6b35',
        },
      }}
    />
  );
})}

          {/* Active/Inactive Switch */}
          <FormControlLabel
            control={
              <Switch
                checked={(formData.is_active ?? 1) === 1}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))
                }
              />
            }
            label="Active"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={handleDialogClose} 
          disabled={loading}
           sx={{
            padding: "8px 24px",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 500,
            backgroundColor: "#f5f5f5",
            color: "#444",
            border: "1px solid #ccc",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "#e0e0e0",
              borderColor: "#999",
              color: "#222",
            },
          }}
          >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSave} 
          disabled={loading}
           sx={{
            padding: "8px 24px",
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 600,
            background: 'linear-gradient(45deg, #f97316, #ea580c)',
            color: "#fff",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            "&:hover": {
              background: 'linear-gradient(45deg, #ea580c, #dc2626)',
              boxShadow: "0 6px 16px rgba(0,0,0,0.25)",
            },
            "&.Mui-disabled": {
              background: "#ccc",
              color: "#777",
              boxShadow: "none",
            },
          }}
          >
            
          {loading ? <CircularProgress size={20} /> : (editMode ? "Update" : "Create")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarehouseFormModal;