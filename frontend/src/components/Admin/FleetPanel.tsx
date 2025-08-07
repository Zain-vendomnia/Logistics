import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  MenuItem,
  Slider,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { FireTruckOutlined } from "@mui/icons-material";

const steps = ["Fleet", "Tours Overview"];

const FleetPanel: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [vehicleType, setVehicleType] = useState("Car");
  const [endLocation, setEndLocation] = useState("Start");
  const [schedule, setSchedule] = useState([7.3, 19.3]);
  const [maxDistanceEnabled, setMaxDistanceEnabled] = useState(false);
  const [maxShiftEnabled, setMaxShiftEnabled] = useState(false);
  const [maxDistance, setMaxDistance] = useState(100);
  const [maxShift, setMaxShift] = useState(8);
  const [fleetCostDuration, setFleetCostDuration] = useState(0.0015);
  const [fleetCostDistance, setFleetCostDistance] = useState(0.02);
  const [fleetCostFixed, setFleetCostFixed] = useState(50);

  const handleChange = (_event: Event, newValue: number | number[]) => {
    if (Array.isArray(newValue)) {
      setSchedule(newValue);
    }
  };

  const handleEndLocationChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: string | null
  ) => {
    if (newValue !== null) {
      setEndLocation(newValue);
    }
  };

  return (
    <Box>
      {/* Stepper */}
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Start Location */}
      <Typography variant="h6" gutterBottom>
        Start Location
      </Typography>
      <TextField
        fullWidth
        label="Where is your start location?"
        size="medium"
        sx={{ mb: 2 }}
      />

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mb: 2, display: "block" }}
      >
        The tours will end at the start location
      </Typography>

      {/* Fleet */}
      <Typography variant="h6" gutterBottom>
        Fleet
      </Typography>

      <TextField
        select
        fullWidth
        label="Vehicle Type"
        value={vehicleType}
        onChange={(e) => setVehicleType(e.target.value)}
        size="medium"
        sx={{ mb: 2 }}
      >
        <MenuItem value="Car">
          <FireTruckOutlined sx={{ mr: 1 }} />
          Truck
        </MenuItem>
      </TextField>

      <Box display="flex" gap={1} sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="No of Vehicles"
          defaultValue={1}
          size="medium"
        />
        <TextField
          fullWidth
          label="Capacity per Vehicle"
          defaultValue={1800}
          size="medium"
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" gutterBottom>
          Maximum Distance (km)
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <FormControlLabel
            control={
              <Switch
                checked={maxDistanceEnabled}
                onChange={(e) => setMaxDistanceEnabled(e.target.checked)}
              />
            }
            label=""
            sx={{ m: 0 }}
          />
          <TextField
            size="small"
            value={maxDistance}
            onChange={(e) => setMaxDistance(Number(e.target.value))}
            disabled={!maxDistanceEnabled}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Maximum Shift Time (hr)
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <FormControlLabel
            control={
              <Switch
                checked={maxShiftEnabled}
                onChange={(e) => setMaxShiftEnabled(e.target.checked)}
              />
            }
            label=""
            sx={{ m: 0 }}
          />
          <TextField
            size="small"
            value={maxShift}
            onChange={(e) => setMaxShift(Number(e.target.value))}
            disabled={!maxShiftEnabled}
          />
        </Box>
      </Box>

      {/* Driver's Schedule */}
      <Typography variant="body2" sx={{ mb: 1 }}>
        Driver's Schedule
      </Typography>
      <Slider
        value={schedule}
        onChange={handleChange}
        min={0}
        max={24}
        step={1}
        marks={[
          { value: 0, label: "12 AM" },
          { value: 7.3, label: "7.30 AM" },
          { value: 12, label: "12 PM" },
          { value: 19.3, label: "19.30 PM" },
          { value: 24, label: "12 AM" },
        ]}
        valueLabelDisplay="auto"
        sx={{ mb: 3 }}
      />

      {/* Spacer */}
      <Box flexGrow={1} />

      <Typography variant="body2" gutterBottom>
        Fleet Cost
      </Typography>

      <Box display="flex" gap={1} sx={{ mb: 3 }}>
        <TextField
          label="Duration / Hr"
          size="medium"
          value={fleetCostDuration}
          onChange={(e) => setFleetCostDuration(Number(e.target.value))}
        />
        <TextField
          label="Distance / Km"
          size="medium"
          value={fleetCostDistance}
          onChange={(e) => setFleetCostDistance(Number(e.target.value))}
        />
        <TextField
          label="Fixed / Tour"
          size="medium"
          value={fleetCostFixed}
          onChange={(e) => setFleetCostFixed(Number(e.target.value))}
        />
      </Box>

      {/* Spacer */}
      <Box flexGrow={1} />

      {/* Next Button */}
      <Button
        variant="contained"
        fullWidth
        sx={{ background: "linear-gradient(to right, #3FC8C8, #68E3B7)" }}
      >
        Next
      </Button>
    </Box>
  );
};

export default FleetPanel;
