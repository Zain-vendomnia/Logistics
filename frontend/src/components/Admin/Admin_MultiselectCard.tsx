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
  CircularProgress,
  SelectChangeEvent,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { getAllWarehouses } from '../../services/warehouseService';

interface AdminMultiselectCardProps {
  selectedWarehouses: number[];
  setSelectedWarehouses: (warehouses: number[]) => void;
}

interface WarehouseOption {
  id: number;
  name: string;
}

interface WarehouseApiResponse {
  warehouse_id: number;
  warehouse_name: string;
}

const AdminMultiselectCard: React.FC<AdminMultiselectCardProps> = ({
  selectedWarehouses,
  setSelectedWarehouses,
}) => {
  const [isMultiple, setIsMultiple] = useState(false);
  const [warehouseOptions, setWarehouseOptions] = useState<WarehouseOption[]>([]);
  const [loading, setLoading] = useState(true);

  const selectValue = isMultiple ? selectedWarehouses : selectedWarehouses[0] || '';

  const handleChange = (
    event: SelectChangeEvent<number | number[]>
  ) => {
    const value = event.target.value;
    setSelectedWarehouses(
      isMultiple
        ? (typeof value === 'string'
            ? value.split(',').map(Number)
            : value as number[])
        : [value as number].filter(Boolean)
    );
  };

  const handleReset = () => {
    setSelectedWarehouses([]);
  };

  useEffect(() => {
    const fetchWarehouseData = async () => {
      try {
        const warehouses = await getAllWarehouses();
        const warehousesData = warehouses as WarehouseApiResponse[];

        const uniqueWarehouses = Array.from(
          new Map(
            warehousesData.map((w) => [
              w.warehouse_id,
              { id: w.warehouse_id, name: `${w.warehouse_name} - ${w.warehouse_id}` },
            ])
          ).values()
        );

        setWarehouseOptions(uniqueWarehouses);

        const validIds = new Set(uniqueWarehouses.map((w) => w.id));
        const filteredSelected = selectedWarehouses.filter((id) =>
          validIds.has(id)
        );

        if (filteredSelected.length !== selectedWarehouses.length) {
          setSelectedWarehouses(filteredSelected);
        }
      } catch (error) {
        console.error('Error fetching warehouse data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWarehouseData();
    // Only run once or when `setSelectedWarehouses` changes, not on every selectedWarehouses change
  }, [setSelectedWarehouses, selectedWarehouses]);

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
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#f7941d' }}>
          Select Warehouses
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
          <InputLabel id="warehouse-select-label">Warehouses</InputLabel>
          <Select
            labelId="warehouse-select-label"
            value={selectValue}
            onChange={handleChange}
            multiple={isMultiple}
            input={<OutlinedInput label="Warehouses" />}
            renderValue={(selected) => {
              const selectedIds = isMultiple ? (selected as number[]) : [selected as number];
              const names = selectedIds.map(
                (id) => warehouseOptions.find((w) => w.id === id)?.name || id
              );
              return names.join(', ');
            }}
          >
            {warehouseOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedWarehouses.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedWarehouses.map((id) => {
              const label = warehouseOptions.find((w) => w.id === id)?.name || id;
              return (
                <Chip
                  key={id}
                  label={label}
                  color="primary"
                  onDelete={() =>
                    setSelectedWarehouses(selectedWarehouses.filter((w) => w !== id))
                  }
                  deleteIcon={<ClearIcon />}
                />
              );
            })}
          </Box>
        )}

        <Button
          fullWidth
          variant="outlined"
          onClick={handleReset}
          sx={(theme) => ({
            mt: 2,
            background: theme.palette.primary.gradient,
            color: theme.palette.primary.contrastText,
            '&:hover': {
              background: theme.palette.primary.dark,
              color: theme.palette.primary.contrastText,
            },
          })}
          disabled={selectedWarehouses.length === 0}
        >
          Reset Selection
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdminMultiselectCard;
