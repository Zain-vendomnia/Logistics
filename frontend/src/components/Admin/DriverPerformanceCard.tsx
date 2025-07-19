import React, { useEffect, useRef } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Avatar, Typography,
  Button, Box, Divider, Chip, Rating, useTheme, Tooltip, Grid, Badge
} from '@mui/material';
import {
  Visibility as VisibilityIcon, LocalShipping as LocalShippingIcon,
  PhotoCamera, AssignmentTurnedIn, Timer, EvStation, Map, ThumbUp
} from '@mui/icons-material';


const confetti = require('canvas-confetti');

export interface DriverPerformanceCardProps {
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  rating: number;
  warehouseId: string;
  warehouseName: string;
  completedTours: number;

  // KPIs
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
}

const DriverPerformanceCard: React.FC<DriverPerformanceCardProps> = ({
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
  onViewDetail
}) => {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement | null>(null);

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
      label: 'Image Uploads',
      value: `${kpi1ImageUploadScore}/5`,
      tooltip: `${kpi1ImageCount} images`,
      icon: <PhotoCamera aria-label="Image Uploads" />,
      color: theme.palette.info.main,
      score: kpi1ImageUploadScore
    },
    {
      label: 'Deliveries',
      value: `${kpi2DeliveryScore}/5`,
      tooltip: `${totalActualDeliveries}/${totalExpectedDeliveries} completed`,
      icon: <AssignmentTurnedIn aria-label="Deliveries" />,
      color: theme.palette.success.main,
      score: kpi2DeliveryScore
    },
    {
      label: 'Proof of Delivery',
      value: `${kpi3PODScore}/5`,
      tooltip: `${validPODs} valid PODs`,
      icon: <LocalShippingIcon aria-label="Proof of Delivery" />,
      color: theme.palette.warning.main,
      score: kpi3PODScore
    },
    {
      label: 'KM Efficiency',
      value: `${kpi4KmEfficiencyScore}/5`,
      tooltip: `${actualKM}km vs ${plannedKM}km`,
      icon: <Map aria-label="KM Efficiency" />,
      color: theme.palette.primary.main,
      score: kpi4KmEfficiencyScore
    },
    {
      label: 'Time Mgmt',
      value: `${kpi5TimeScore}/5`,
      tooltip: `${totalActualTimeMinutes} vs ${totalPlannedTimeMinutes} mins`,
      icon: <Timer aria-label="Time Management" />,
      color: theme.palette.secondary.main,
      score: kpi5TimeScore
    },
    {
      label: 'Fuel Efficiency',
      value: `${kpi6FuelEfficiencyScore}/5`,
      tooltip: `${actualFuelLiters}L used vs ${expectedFuelLiters}L`,
      icon: <EvStation aria-label="Fuel Efficiency" />,
      color: theme.palette.error.main,
      score: kpi6FuelEfficiencyScore
    },
    {
      label: 'Customer Rating',
      value: `${kpi7CustomerRating}/5`,
      tooltip: `Based on feedback`,
      icon: <ThumbUp aria-label="Customer Rating" />,
      color: theme.palette.success.light,
      score: kpi7CustomerRating
    }
  ];

  return (
    <Card
      ref={cardRef}
      sx={{
        width: '100%',
        maxWidth: 580,
        borderRadius: 5,
        px: 4,
        py: 4,
        boxShadow: theme.shadows[5],
        border: `1px solid ${theme.palette.divider}`,
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[100]})`,
        transition: 'transform 0.35s ease, box-shadow 0.35s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: `0 24px 48px ${theme.palette.primary.main}44`
        }
      }}
      role="region"
      aria-label={`Driver performance card for ${name}`}
    >
      <CardHeader
        avatar={
          <Avatar
            src={avatarUrl}
            sx={{
              width: 72,
              height: 72,
              fontSize: '1.85rem',
              bgcolor: avatarUrl ? 'transparent' : theme.palette.primary.main,
              boxShadow: `0 0 8px ${theme.palette.primary.main}77`
            }}
            aria-label={`${name}'s avatar`}
          >
            {!avatarUrl && name[0].toUpperCase()}
          </Avatar>
        }
        title={
          <Typography
            variant="h4"
            fontWeight={800}
            component="h2"
            noWrap
            sx={{ letterSpacing: '0.03em', color: theme.palette.text.primary }}
          >
            {name}
          </Typography>
        }
        subheader={
          <Box>
            <Tooltip title={email} arrow>
              <Typography
                variant="body1"
                color="text.secondary"
                noWrap
                aria-label={`Email: ${email}`}
                sx={{ mb: 0.25, fontWeight: 600 }}
              >
                {email}
              </Typography>
            </Tooltip>
            <Tooltip title={mobile} arrow>
              <Typography
                variant="body1"
                color="text.secondary"
                noWrap
                aria-label={`Mobile: ${mobile}`}
                sx={{ fontWeight: 600 }}
              >
                {mobile}
              </Typography>
            </Tooltip>
          </Box>
        }
        action={
          <Chip
            icon={<LocalShippingIcon aria-label="Completed Tours" />}
            label={`${completedTours} Tours`}
            color={completedTours > 0 ? 'success' : 'default'}
            sx={{
              fontWeight: 'bold',
              borderRadius: 3,
              minWidth: 110,
              px: 2,
              py: 1,
              fontSize: '1rem',
              boxShadow: completedTours > 0 ? `0 0 8px ${theme.palette.success.main}aa` : undefined
            }}
            aria-label={`${completedTours} completed tours`}
          />
        }
        sx={{ pb: 1 }}
      />

      <Divider sx={{ my: 3 }} />

      <CardContent sx={{ pt: 0 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          mb={4}
          flexDirection="column"
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.success.light}66, ${theme.palette.success.main}bb)`,
            borderRadius: 4,
            py: 3,
            px: 6,
            boxShadow: `0 4px 12px ${theme.palette.success.main}88`
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color={theme.palette.success.dark}
            mb={0.5}
            sx={{ letterSpacing: 0.5 }}
          >
            Overall Rating
          </Typography>
          <Rating value={rating} precision={0.1} readOnly size="large" sx={{ mb: 0.5 }} />
          <Typography
            fontWeight={900}
            fontSize="1.6rem"
            color={rating >= 4.5 ? theme.palette.success.dark : theme.palette.text.primary}
            aria-label={`Overall rating: ${rating.toFixed(1)} out of 5`}
            sx={{ letterSpacing: '0.05em' }}
          >
            {rating.toFixed(1)} / 5
          </Typography>
        </Box>

      <Grid container spacing={2}>
  {kpiBlocks.map(({ label, value, tooltip, icon, color, score }, index) => {
    const isHighScore = score >= 4.5;
    return (
      <Grid item xs={12} sm={6} key={index}>
        <Tooltip title={tooltip} arrow>
          <Box
            tabIndex={0}
            role="group"
            aria-label={`${label} KPI: ${value}`}
            sx={{
              background: `${color}11`,
              borderRadius: 3,
              p: 2,
              boxShadow: isHighScore ? `0 0 12px 3px ${color}88` : `inset 0 0 8px ${color}22`,
              cursor: 'default',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 140,          // fixed height for all KPI cards
              width: '100%',        // full width within Grid item
              textAlign: 'center',
              '&:hover, &:focus-visible': {
                transform: 'scale(1.05)',
                boxShadow: `0 4px 12px ${color}aa`,
                outline: 'none'
              }
            }}
          >
            <Badge
              color="secondary"
              overlap="circular"
              invisible={!isHighScore}
              badgeContent="⭐"
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              sx={{ mb: 0.5 }}
            >
              {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
            </Badge>
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{ mt: 0.25, mb: 0.5 }}
              color={color}
            >
              {value}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={500}
              sx={{ userSelect: 'none' }}
            >
              {label}
            </Typography>
          </Box>
        </Tooltip>
      </Grid>
    );
  })}
</Grid>

      </CardContent>

      <Divider sx={{ mt: 4 }} />

      <CardActions sx={{ justifyContent: 'center', pt: 2 }}>
       <Button
  variant="contained"
  startIcon={<VisibilityIcon aria-hidden="true" />}
  onClick={onViewDetail}
  aria-label={`View detailed performance for ${name}`}
  sx={{
    borderRadius: 20,
    textTransform: 'none',
    fontWeight: 700,
    px: 6,
    py: 1.5,
    width: '100%',
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
    boxShadow: '0 4px 15px rgba(0, 128, 0, 0.3)',
    color: theme.palette.common.white,
    '&:hover': {
      background: `linear-gradient(45deg, ${theme.palette.success.dark}, ${theme.palette.primary.dark})`,
      boxShadow: '0 6px 20px rgba(0, 128, 0, 0.5)',
    }
  }}
>
  View Detailed Performance
</Button>

      </CardActions>
    </Card>
  );
};

export default DriverPerformanceCard;
