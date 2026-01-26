import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { SolarModule } from "../../types/order.type";
import adminApiService from "../../services/adminApiService";
import { useNotificationStore } from "../../store/useNotificationStore";

const NewSolarModule = () => {
  const notification = useNotificationStore();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<SolarModule>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    setFormData({
      name: "",
      weight: 0,
    });
    setErrors({});
  }, [showModal]);

  const handleFieldChange = (name: string, value: string) => {
    if (name === "weight") {
      const numericValue = Math.max(0, Number(value));

      setFormData((prev) => ({
        ...prev,
        weight: numericValue,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const submitModuleRequest = useCallback(async () => {
    setIsLoading(true);

    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Module name is required";
    }
    if (!formData.weight || formData.weight <= 0) {
      newErrors.weight = "Weight must be greater than 0";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    //   console.log("Solar Module Payload:", formData);

    const reqData: SolarModule = {
      id: 0,
      name: formData.name!,
      weight: formData.weight!,
    };
    await adminApiService
      .createSolarModule(reqData)
      .then((res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          notification.showNotification({ message: res.message });
        }
        setShowModal(false);
      })
      .catch((error) => {
        const msg =
          error instanceof Error ? error.message : String(error.message);
        notification.showNotification({ message: msg });
      })
      .finally(() => {
        setIsLoading(false);
      });

  }, [formData]);

  const formFields = [
    {
      name: "name",
      label: "Module Name",
      type: "text",
      placeholder: "Enter module name",
    },
    {
      name: "weight",
      label: "Weight (kg)",
      type: "number",
      placeholder: "Weight in KGs",
    },
  ];

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        sx={{
          background: "linear-gradient(45deg, #f97316, #ea580c)",
          color: "white",
          fontWeight: 600,
          textTransform: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          "&:hover": {
            background: "linear-gradient(45deg, #ea580c, #dc2626)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            transform: "translateY(-1px)",
          },
          transition: "all 0.2s ease-in-out",
        }}
      >
        <AddIcon />
        New Solar Module
      </Button>

      {showModal && (
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>
            <Typography variant={"h5"}>Add New Solar Module</Typography>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              {formFields.map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={(formData as any)[field.name] ?? ""}
                  onChange={(e) =>
                    handleFieldChange(field.name, e.target.value)
                  }
                  error={!!errors[field.name]}
                  helperText={errors[field.name]}
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      step: 0.5,
                    },
                  }}
                />
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={submitModuleRequest}>Add</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};

export default NewSolarModule;
