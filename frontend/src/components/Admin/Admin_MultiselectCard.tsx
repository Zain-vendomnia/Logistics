import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Typography,
  Button,
  Switch,
  FormControlLabel,
} from '@mui/material';

import latestOrderServices from './AdminServices/latestOrderServices';


interface Admin_MultiselectCardProps {
  selectedZipcodes: string[];
  setSelectedZipcodes: (zips: string[]) => void;
}

interface ZipOption {
  zipcode: string;
  city: string;
}

const Admin_MultiselectCard: React.FC<Admin_MultiselectCardProps> = ({
  selectedZipcodes,
  setSelectedZipcodes,
}) => {
  const [isMultiple, setIsMultiple] = useState(false);
  const [zipOptions, setZipOptions] = useState<ZipOption[]>([]);

  const handleChange = (event: any) => {
    const {
      target: { value },
    } = event;
    setSelectedZipcodes(typeof value === 'string' ? value.split(',') : value);
  };

  const handleReset = () => {
    setSelectedZipcodes([]);
  };

  useEffect(() => {
    const fetchZipData = async () => {
      const orderService = latestOrderServices.getInstance();
      const orders = await orderService.getOrders();

      // Extract and de-duplicate ZIP + City combos
      const uniqueZips = Array.from(
        new Map(
          orders.map((o) => [`${o.zipcode}-${o.city}`, { zipcode: o.zipcode, city: o.city }])
        ).values()
      );

      setZipOptions(uniqueZips);
    };

    fetchZipData();
  }, []);

  return (
    <Card sx={{ maxWidth: 600, margin: '2rem auto', padding: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Select ZIP Codes
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={isMultiple}
              onChange={() => setIsMultiple(!isMultiple)}
              color="primary"
            />
          }
          label={isMultiple ? 'Multiple Selection' : 'Single Selection'}
        />

        <FormControl sx={{ minWidth: 240, mt: 2 }}>
          <InputLabel id="zipcode-select-label">ZIP Codes</InputLabel>
          <Select
            labelId="zipcode-select-label"
            value={selectedZipcodes}
            onChange={handleChange}
            multiple={isMultiple}
            input={<OutlinedInput label="ZIP Codes" />}
            renderValue={(selected) => selected.join(', ')}
          >
            {zipOptions.map((opt) => (
              <MenuItem key={opt.zipcode} value={opt.zipcode}>
                {opt.city} - {opt.zipcode}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {selectedZipcodes.map((zipcode) => (
            <Chip key={zipcode} label={zipcode} />
          ))}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Button variant="outlined" color="secondary" onClick={handleReset}>
            Reset Selection
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Admin_MultiselectCard;
