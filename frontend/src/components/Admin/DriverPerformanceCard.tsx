import React, { useEffect, useRef, useState } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Avatar, Typography,
  Button, Box, Divider, Chip, Rating, useTheme, Tooltip, Grid, Badge
} from '@mui/material';
import {
  Download as DownloadIcon, LocalShipping as LocalShippingIcon,
  PhotoCamera, AssignmentTurnedIn, Timer, EvStation, Map, ThumbUp
} from '@mui/icons-material';

import confetti from 'canvas-confetti';
import DriverPerformanceReport from './DriverPerformanceReport';

export interface DriverPerformanceCardProps {
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  rating: number;
  warehouseId: string;
  warehouseName: string;
  completedTours: number;
  kpi1ImageUploadScore: number;
  kpi1ImageCount: number;
  kpi2DeliveryScore: number;
  totalExpectedDeliveries: number;
  totalActualDeliveries: number;
  undeliveredCount: number;
  kpi3PODScore: number;
  validPODs: number;
  kpi4KmEfficiencyScore: number;
  plannedKM: number;
  actualKM: number;
  kpi5TimeScore: number;
  totalPlannedTimeMinutes: number;
  totalActualTimeMinutes: number;
  kpi6FuelEfficiencyScore: number;
  expectedFuelLiters: number;
  actualFuelLiters: number;
  kpi7CustomerRating: number;
  onViewDetail?: () => void;
  dateRange?: { from: string; to: string };
}

const DriverPerformanceCard: React.FC<DriverPerformanceCardProps> = ({
  name, email, mobile, avatarUrl, rating, warehouseName, completedTours,
  kpi1ImageUploadScore, kpi1ImageCount, kpi2DeliveryScore, totalExpectedDeliveries,
  totalActualDeliveries, undeliveredCount, kpi3PODScore, validPODs,
  kpi4KmEfficiencyScore, plannedKM, actualKM, kpi5TimeScore,
  totalPlannedTimeMinutes, totalActualTimeMinutes, kpi6FuelEfficiencyScore,
  expectedFuelLiters, actualFuelLiters, kpi7CustomerRating, onViewDetail,
  dateRange = { from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }
}) => {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (rating >= 4.5 && cardRef.current) {
      const { left, top, width, height } = cardRef.current.getBoundingClientRect();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: {
          x: (left + width / 2) / window.innerWidth,
          y: (top + height / 2) / window.innerHeight
        },
        colors: [theme.palette.success.main, theme.palette.primary.main, theme.palette.warning.main]
      });
    }
  }, [rating, theme]);

  const kpiBlocks = [
    {
      label: 'Image Uploads', value: `${kpi1ImageUploadScore}/5`, tooltip: `${kpi1ImageCount} images`,
      icon: <PhotoCamera />, color: theme.palette.info.main, score: kpi1ImageUploadScore
    },
    {
      label: 'Deliveries', value: `${kpi2DeliveryScore}/5`, tooltip: `${totalActualDeliveries}/${totalExpectedDeliveries} completed`,
      icon: <AssignmentTurnedIn />, color: theme.palette.success.main, score: kpi2DeliveryScore
    },
    {
      label: 'Proof of Delivery', value: `${kpi3PODScore}/5`, tooltip: `${validPODs} valid PODs`,
      icon: <LocalShippingIcon />, color: theme.palette.warning.main, score: kpi3PODScore
    },
    {
      label: 'KM Efficiency', value: `${kpi4KmEfficiencyScore}/5`, tooltip: `${actualKM}km vs ${plannedKM}km`,
      icon: <Map />, color: theme.palette.primary.main, score: kpi4KmEfficiencyScore
    },
    {
      label: 'Time Mgmt', value: `${kpi5TimeScore}/5`, tooltip: `${totalActualTimeMinutes} vs ${totalPlannedTimeMinutes} mins`,
      icon: <Timer />, color: theme.palette.secondary.main, score: kpi5TimeScore
    },
    {
      label: 'Fuel Efficiency', value: `${kpi6FuelEfficiencyScore}/5`, tooltip: `${actualFuelLiters}L used vs ${expectedFuelLiters}L`,
      icon: <EvStation />, color: theme.palette.error.main, score: kpi6FuelEfficiencyScore
    },
    {
      label: 'Customer Rating', value: `${kpi7CustomerRating}/5`, tooltip: `Based on feedback`,
      icon: <ThumbUp />, color: theme.palette.success.light, score: kpi7CustomerRating
    }
  ];

  const handleDownloadReport = () => {
    setReportOpen(true);
  };

  const handleCloseReport = () => {
    setReportOpen(false);
  };

  // Prepare driver data for the report
  const driverData = {
    name,
    email,
    mobile,
    avatarUrl,
    rating,
    warehouseName,
    completedTours,
    kpi1ImageUploadScore,
    kpi1ImageCount,
    kpi2DeliveryScore,
    totalExpectedDeliveries,
    totalActualDeliveries,
    undeliveredCount,
    kpi3PODScore,
    validPODs,
    kpi4KmEfficiencyScore,
    plannedKM,
    actualKM,
    kpi5TimeScore,
    totalPlannedTimeMinutes,
    totalActualTimeMinutes,
    kpi6FuelEfficiencyScore,
    expectedFuelLiters,
    actualFuelLiters,
    kpi7CustomerRating,
    dateRange
  };

  return (
    <>
      <Card ref={cardRef} sx={{
        width: '100%', borderRadius: 4, px: 2.5, py: 2.5,
        boxShadow: theme.shadows[3], border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[100]})`,
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: `0 18px 36px ${theme.palette.primary.main}33`
        }
      }}>
        <CardHeader
          avatar={<Avatar src={avatarUrl} sx={{ width: 60, height: 60, fontSize: '1.6rem', bgcolor: avatarUrl ? 'transparent' : theme.palette.primary.main }}>
            {!avatarUrl && name[0].toUpperCase()}
          </Avatar>}
          title={<Typography variant="h5" fontWeight={700}>{name}</Typography>}
          subheader={<Box>
            <Tooltip title={email}><Typography variant="body2" noWrap>{email}</Typography></Tooltip>
            <Tooltip title={mobile}><Typography variant="body2" noWrap>{mobile}</Typography></Tooltip>
          </Box>}
          action={<Chip icon={<LocalShippingIcon />} label={`${completedTours} Tours`} color={completedTours > 0 ? 'success' : 'default'} />}
        />

        <Divider sx={{ my: 2 }} />

        <CardContent>
          <Box textAlign="center" sx={{ background: `${theme.palette.success.light}33`, borderRadius: 2, py: 2.5, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700}>Overall Rating</Typography>
            <Rating value={rating} precision={0.1} readOnly size="medium" />
            <Typography variant="h6" fontWeight={800}>{rating.toFixed(1)} / 5</Typography>
          </Box>

          <Grid container spacing={0.8} justifyContent="center">
            {kpiBlocks.map(({ label, value, tooltip, icon, color, score }, i) => (
              <Grid item key={i} xs={12} sm={6} md={4} lg={3} sx={{ mb: 3 }}>
                <Tooltip title={tooltip}>
                  <Box sx={{
                    background: `${color}11`, borderRadius: 2, p: 1.5,
                    textAlign: 'center', height: 120, width: '120px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    boxShadow: score >= 4.5 ? `0 0 8px 2px ${color}66` : `inset 0 0 6px ${color}22`
                  }}>
                    <Badge invisible={score < 4.5} badgeContent="⭐" color="secondary">
                      {React.cloneElement(icon, { sx: { color, fontSize: 26 } })}
                    </Badge>
                    <Typography variant="subtitle1" fontWeight={600} color={color}>{value}</Typography>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                  </Box>
                </Tooltip>
              </Grid>
            ))}
          </Grid>
        </CardContent>

        <Divider sx={{ mt: 3 }} />

        <CardActions sx={{ justifyContent: 'center', pt: 2 }}>
          <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadReport} sx={{
            borderRadius: 20, textTransform: 'none', fontWeight: 600, px: 5, py: 1.2,
            width: '100%', background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
          }}>
            Download Report
          </Button>
        </CardActions>
      </Card>

      {/* Report Component */}
      <DriverPerformanceReport
        open={reportOpen}
        onClose={handleCloseReport}
        driverData={driverData}
      />
    </>
  );
};

export default DriverPerformanceCard;