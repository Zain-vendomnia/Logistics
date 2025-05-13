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
  CircularProgress
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import latestOrderServices from './AdminServices/latestOrderServices';

interface AdminMultiselectCardProps {
  selectedZipcodes: string[];
  setSelectedZipcodes: (zips: string[]) => void;
}

interface ZipOption {
  zipcode: string;
  city: string;
}

const AdminMultiselectCard: React.FC<AdminMultiselectCardProps> = ({
  selectedZipcodes = [], // Default empty array
  setSelectedZipcodes,
}) => {
  const [isMultiple, setIsMultiple] = useState(false);
  const [zipOptions, setZipOptions] = useState<ZipOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Properly handle both single and multi-select values
  const selectValue = isMultiple 
    ? selectedZipcodes 
    : selectedZipcodes[0] || '';

  const handleChange = (event: any) => {
    const value = event.target.value;
    setSelectedZipcodes(
      isMultiple 
        ? (typeof value === 'string' ? value.split(',') : value) 
        : [value].filter(Boolean) // Ensure we always return an array
    );
  };

  const handleReset = () => {
    setSelectedZipcodes([]);
  };

  useEffect(() => {
    const fetchZipData = async () => {
      try {
        const orderService = latestOrderServices.getInstance();
        const orders = await orderService.getOrders();

        // Extract and de-duplicate ZIP + City combos (your original logic)
        const uniqueZips = Array.from(
          new Map(
            orders.map((o) => [`${o.zipcode}-${o.city}`, { zipcode: o.zipcode, city: o.city }])
          ).values()
        );

        setZipOptions(uniqueZips);
        
        // Filter out any selected zipcodes that don't exist in the new options
        if (selectedZipcodes.length > 0) {
          const availableZips = uniqueZips.map(z => z.zipcode);
          setSelectedZipcodes(selectedZipcodes.filter(z => availableZips.includes(z)));
        }
      } catch (error) {
        console.error('Error fetching zip data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchZipData();
  }, []);

  if (loading) {
    return (
      <Card sx={{ maxWidth: 600, margin: '0 auto', p: 2, textAlign: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 600, p: 2, border: '1px solid #e0e0e0' }}>
      <CardContent>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold',
          color: '#f7941d'  // Direct hex color
        }}
      >
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
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth>
          <InputLabel id="zipcode-select-label">ZIP Codes</InputLabel>
          <Select
            labelId="zipcode-select-label"
            value={selectValue}
            onChange={handleChange}
            multiple={isMultiple}
            input={<OutlinedInput label="ZIP Codes" />}
            renderValue={(selected) => {
              if (isMultiple) {
                return (selected as string[]).join(', ');
              }
              return selected as string;
            }}
          >
            {zipOptions.map((option) => (
              <MenuItem key={option.zipcode} value={option.zipcode}>
                {option.city} - {option.zipcode}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedZipcodes.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedZipcodes.map((zipcode) => (
              <Chip
                key={zipcode}
                label={zipcode}
                color="primary"
                onDelete={() => setSelectedZipcodes(selectedZipcodes.filter((zip) => zip !== zipcode))}
                deleteIcon={<ClearIcon />}
              />
            ))}
          </Box>
        )}

<Button
  fullWidth
  variant="outlined"
  onClick={handleReset}
  sx={(theme) => ({
    mt: 2,
    background: theme.palette.primary.gradient,
    color: "#fff",
    "&:hover": {
      background: "#fff", // or any solid background you prefer
      color: theme.palette.primary.dark,
    }
  })}
  disabled={selectedZipcodes.length === 0}
>
  Reset Selection
</Button>
      </CardContent>
    </Card>
  );
};

export default AdminMultiselectCard;