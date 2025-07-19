import React, { useEffect, useRef } from 'react';
import {
  Card, CardHeader, CardContent, CardActions, Avatar, Typography,
  Button, Box, Divider, Chip, Rating, useTheme, Tooltip
} from '@mui/material';

import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, Cell
} from 'recharts';

import {
  Visibility as VisibilityIcon, LocalShipping as LocalShippingIcon,
  CheckCircle as CheckCircleIcon, Pending as PendingIcon
} from '@mui/icons-material';


const confetti = require('canvas-confetti');

export interface DriverPerformanceCardProps {
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  stats: {
    total: number;
    completed: number;
    pending: number;
    totalHours: number;
    earlyCompletions: number;
    delayedCompletions: number;
  };
  rating?: number;
  warehouseId?: string;
  warehouseName?: string;
  totalHours?: number;
  earlyCompletions?: number;
  delayedCompletions?: number;
  onViewDetail?: () => void;
}

const DriverPerformanceCard: React.FC<DriverPerformanceCardProps> = ({
  name, email, mobile, avatarUrl, stats, rating = 0, onViewDetail,
  totalHours = 0, earlyCompletions = 0, delayedCompletions = 0
}) => {
  const theme = useTheme();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const barData = [
    { label: 'Total', value: stats.total, fill: theme.palette.primary.main },
    { label: 'Completed', value: stats.completed, fill: theme.palette.success.main },
    { label: 'Pending', value: stats.pending, fill: theme.palette.warning.main }
  ];

  useEffect(() => {
    if (rating >= 4.5 && cardRef.current) {
      const { left, top, width, height } = cardRef.current.getBoundingClientRect();
      confetti({
        particleCount: 100,
        spread: 70,
        origin: {
          x: (left + width / 2) / window.innerWidth,
          y: (top + height / 2) / window.innerHeight
        },
        colors: [
          theme.palette.success.main,
          theme.palette.primary.main,
          theme.palette.warning.main
        ]
      });
    }
  }, [rating, theme]);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const createParticle = (x: number, y: number) => {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.background = `radial-gradient(circle, ${['#00f2fe', '#4facfe', '#43e97b', '#38f9d7'][Math.floor(Math.random() * 4)]
        }, transparent)`;
      card.appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1000);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      createParticle(x, y);
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <Card
      ref={cardRef}
      sx={{
        width: '100%',
        maxWidth: 540,
        borderRadius: 4,
        px: 3,
        py: 2,
        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        border: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border 0.3s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: `0 16px 32px ${theme.palette.primary.main}44`,
          border: `1px solid ${theme.palette.primary.main}`,
          cursor: 'none',
        },
      }}
    >

      <CardHeader
        avatar={
          <Avatar src={avatarUrl} sx={{
            width: 64, height: 64, fontSize: '1.75rem',
            bgcolor: avatarUrl ? 'transparent' : theme.palette.primary.main,
            border: `3px solid ${theme.palette.primary.light}`,
            boxShadow: `0 4px 12px ${theme.palette.primary.light}`
          }}>
            {!avatarUrl && name[0].toUpperCase()}
          </Avatar>
        }
        title={
          <Typography variant="h5" fontWeight={700} noWrap>
            {name}
          </Typography>
        }
        subheader={
          <Box>
            <Tooltip title={email}><Typography variant="body2" color="text.secondary" noWrap>{email}</Typography></Tooltip>
            <Tooltip title={mobile}><Typography variant="body2" color="text.secondary" noWrap>{mobile}</Typography></Tooltip>
          </Box>
        }
        action={
          <Chip
            icon={<LocalShippingIcon />}
            label={`${completionRate}% Completion`}
            color={
              completionRate > 75 ? 'success' :
                completionRate > 50 ? 'warning' : 'error'
            }
            sx={{ mt: 1, fontWeight: 'bold', borderRadius: 3 }}
          />
        }
        sx={{ pb: 0 }}
      />

      <Divider sx={{ my: 2 }} />

      <CardContent sx={{ pt: 0, flexGrow: 1 }}>
        {/* Top metrics */}
        <Box display="flex" justifyContent="space-around" mb={3}>
          {[{
            label: 'Total Jobs', value: stats.total, icon: <LocalShippingIcon />, color: theme.palette.primary.main
          }, {
            label: 'Completed', value: stats.completed, icon: <CheckCircleIcon />, color: theme.palette.success.main
          }, {
            label: 'Pending', value: stats.pending, icon: <PendingIcon />, color: theme.palette.warning.main
          }].map(({ label, value, icon, color }) => (
            <Box key={label} display="flex" flexDirection="column" alignItems="center" sx={{
              p: 1, borderRadius: 3, minWidth: 100, background: theme.palette.background.paper,
              boxShadow: `0 4px 10px ${theme.palette.grey[200]}`
            }}>
              <Box display="flex" alignItems="center" mb={0.5}>
                {React.cloneElement(icon, { sx: { fontSize: 28, color, mr: 0.5 } })}
                <Typography variant="h6" fontWeight={700} color={color}>{value}</Typography>
              </Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary">{label}</Typography>
            </Box>
          ))}
        </Box>

        {/* Rating and Performance Chart */}
        <Box display="flex" gap={2} height={160}>
          <Box flex={1.1} display="flex" flexDirection="column" alignItems="center" justifyContent="center" sx={{
            background: `linear-gradient(145deg, ${theme.palette.secondary.light}22, ${theme.palette.secondary.main}22)`,
            borderRadius: 3, boxShadow: `inset 0 0 12px ${theme.palette.secondary.light}`
          }}>
            <Typography variant="subtitle2" fontWeight="bold" color={theme.palette.secondary.dark}>Overall Rating</Typography>
            <Rating
              name="driver-rating"
              value={rating}
              precision={0.1}
              readOnly
              size="large"
              sx={{
                '& .MuiRating-iconEmpty': {
                  color: `${theme.palette.primary.main}`// or use a soft secondary/main shade
                },
                '& .MuiRating-iconFilled': {
                  color: theme.palette.warning.main, // or any accent color you prefer
                }
              }}
            />
            <Typography variant="body1" fontWeight={600}>{rating.toFixed(1)} / 5</Typography>
          </Box>
          <Box flex={1.4} px={2} py={1.5} sx={{
            background: `linear-gradient(145deg, ${theme.palette.primary.light}22, ${theme.palette.primary.main}22)`,
            borderRadius: 3, boxShadow: `inset 0 0 12px ${theme.palette.primary.light}`
          }}>
            <Typography variant="subtitle2" textAlign="center" fontWeight="bold" mb={1} color={theme.palette.primary.dark}>Performance Overview</Typography>
            <ResponsiveContainer width="100%" height="80%">
              <BarChart data={barData} layout="vertical" barCategoryGap={12} margin={{ left: 8 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" axisLine={false} tickLine={false}
                  tick={{ fontSize: 13, fontWeight: 600, fill: theme.palette.text.primary }} width={80} />

                <RechartsTooltip
                  formatter={(v: number | string) => [`${v} jobs`]}
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 8,
                    boxShadow: theme.shadows[3]
                  }}
                />

                <Bar dataKey="value" radius={[4, 10, 10, 4]} background={{ fill: theme.palette.grey[200] }}>
                  {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Extra Stats */}
        {/* Extra Stats */}
        <Box display="flex" justifyContent="space-between" gap={2} mt={2}>
          {[{
            label: 'Total Hours', value: `${totalHours} hrs`, color: theme.palette.info.main
          }, {
            label: 'Early Completions', value: `${earlyCompletions} hrs`, color: theme.palette.success.main
          }, {
            label: 'Delayed Completions', value: `${delayedCompletions} hrs`, color: theme.palette.error.main
          }].map(({ label, value, color }) => (
            <Box
              key={label}
              flex={1}
              sx={{
                background: `linear-gradient(145deg, ${color}11, ${color}22)`,
                borderRadius: 3,
                p: 2,
                textAlign: 'center',
                border: `1px solid ${color}44`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 72 // uniform height for all boxes
              }}
            >
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ minHeight: 25, lineHeight: 1.4 }}
              >
                {label}
              </Typography>
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{ color, minHeight: 24, lineHeight: 1.5 }}
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>

      <Divider sx={{ mt: 2 }} />

      <CardActions sx={{ justifyContent: 'center', py: 2 }}>
        <Button
          variant="contained"
          startIcon={<VisibilityIcon />}
          onClick={onViewDetail}
          sx={{
            borderRadius: 3,
            textTransform: 'none',
            fontWeight: 700,
            px: 5,
            py: 1.2,
            boxShadow: `0 6px 12px ${theme.palette.primary.main}88`,
            '&:hover': {
              boxShadow: `0 8px 20px ${theme.palette.primary.dark}cc`
            }
          }}
          fullWidth
        >
          View Detailed Performance
        </Button>
      </CardActions>
    </Card>
  );
};

export default DriverPerformanceCard;
