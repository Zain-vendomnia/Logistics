import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Typography,
  Button, Box, Grid, Badge, Paper, IconButton, useTheme, Divider
} from '@mui/material';
import {
  Close as CloseIcon, LocalShipping as LocalShippingIcon,
  PhotoCamera, AssignmentTurnedIn, Timer, EvStation, Map, ThumbUp,
  CheckCircle, Warning, Print as PrintIcon, Email, Phone, Business
} from '@mui/icons-material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

export interface DriverData {
  name: string;
  email: string;
  mobile: string;
  avatarUrl?: string;
  rating: number;
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
  dateRange: { from: string; to: string };
}

interface DriverPerformanceReportProps {
  open: boolean;
  onClose: () => void;
  driverData: DriverData;
}

const DriverPerformanceReport: React.FC<DriverPerformanceReportProps> = ({
  open, onClose, driverData
}) => {
  const theme = useTheme();

  // Fallback data for missing profile info
  const displayData = {
    ...driverData,
    name: driverData.name || 'Driver Name',
    email: driverData.email || 'driver@company.com',
    mobile: driverData.mobile || '+1234567890',
    warehouseName: driverData.warehouseName || 'Warehouse Location'
  };

  // KPI configuration
 const kpiConfig = [
    { key: 'kpi1', label: 'Image Uploads', icon: <PhotoCamera />, score: displayData.kpi1ImageUploadScore,
       metric: `${displayData.kpi1ImageCount} images`, color: '#9C27B0' }, // Purple - for media/photos
    { key: 'kpi2', label: 'Deliveries', icon: <AssignmentTurnedIn />, score: displayData.kpi2DeliveryScore,
      metric: `${displayData.totalActualDeliveries}/${displayData.totalExpectedDeliveries}`, color: '#4CAF50' }, // Green - for success/completion
    { key: 'kpi3', label: 'Proof of Delivery', icon: <LocalShippingIcon />, score: displayData.kpi3PODScore,
      metric: `${displayData.validPODs} valid PODs`, color: '#FF9800' }, // Orange - for verification/validation
    { key: 'kpi4', label: 'KM Efficiency', icon: <Map />, score: displayData.kpi4KmEfficiencyScore,
      metric: `${displayData.actualKM}km vs ${displayData.plannedKM}km`, color: '#2196F3' }, // Blue - for distance/navigation
    { key: 'kpi5', label: 'Time Management', icon: <Timer />, score: displayData.kpi5TimeScore,
      metric: `${displayData.totalActualTimeMinutes} vs ${displayData.totalPlannedTimeMinutes} mins`, color: '#607D8B' }, // Blue Grey - for time/scheduling
    { key: 'kpi6', label: 'Fuel Efficiency', icon: <EvStation />, score: displayData.kpi6FuelEfficiencyScore,
      metric: `${displayData.actualFuelLiters}L vs ${displayData.expectedFuelLiters}L`, color: '#F44336' }, // Red - for fuel/energy consumption
    { key: 'kpi7', label: 'Customer Rating', icon: <ThumbUp />, score: displayData.kpi7CustomerRating,
      metric: `${displayData.kpi7CustomerRating}/5 stars`, color: '#a8910cff' } // Gold - for ratings/excellence
];

  const overallScore = kpiConfig.reduce((acc, kpi) => acc + kpi.score, 0) / kpiConfig.length;
  
  const getPerformanceLevel = (score: number) => ({
    level: score >= 4.5 ? 'Excellent' : score >= 3.5 ? 'Good' : 'Needs Improvement',
    color: score >= 4.5 ? theme.palette.success.main : score >= 3.5 ? theme.palette.warning.main : theme.palette.error.main
  });

  const getInsight = (score: number, label: string) => {
    const perf = getPerformanceLevel(score);
    return {
      icon: score >= 4.5 ? <CheckCircle sx={{ color: perf.color }} /> : <Warning sx={{ color: perf.color }} />,
      message: score >= 4.5 ? `Outstanding ${label.toLowerCase()}! Keep up the excellent work!` :
               score >= 3.5 ? `Good ${label.toLowerCase()}. You're doing well with room for improvement.` :
               `${label} needs attention. Focus on improvement in this area.`,
      color: perf.color,
      recommendation: score >= 4.5 ? "Continue excellent performance!" :
                     score >= 3.5 ? "Focus on consistency to reach excellence." :
                     "Consider additional training and support."
    };
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const chartData = kpiConfig.map(kpi => ({ name: kpi.label, score: kpi.score, fill: kpi.color }));
  const pieData = kpiConfig.map(kpi => ({ name: kpi.label, value: (kpi.score / 5) * 100, fill: kpi.color }));

  const overallAssessment = getPerformanceLevel(overallScore);
  
  const recommendations = overallScore >= 4.5 ? [
    "Continue maintaining excellent standards", "Consider mentoring other drivers",
    "Eligible for performance bonuses", "Set as team role model"
  ] : overallScore >= 3.5 ? [
    "Focus on improving lower-scoring KPIs", "Provide targeted training",
    "Set specific improvement goals", "Regular progress check-ins"
  ] : [
    "Immediate performance improvement plan", "Additional training required",
    "Weekly progress reviews", "Pair with high-performing driver"
  ];

  return (
    <>
      <style>{`
        @media print {
          /* Hide everything except the report */
          body > *:not(.MuiDialog-root) { display: none !important; }
          .no-print { display: none !important; }
          
          /* Reset dialog positioning for print */
          .MuiDialog-root { 
            position: static !important; 
            z-index: 0 !important;
          }
          .MuiDialog-container { 
            position: static !important; 
            transform: none !important;
          }
          .MuiDialog-paper { 
            position: static !important;
            transform: none !important;
            max-width: none !important; 
            width: 100% !important;
            height: auto !important;
            margin: 0 !important; 
            box-shadow: none !important; 
            border-radius: 0 !important;
            max-height: none !important;
            overflow: visible !important;
          }
          .MuiDialog-container .MuiBackdrop-root { display: none !important; }
          
          /* Print-specific content styling */
          .print-container { 
            margin: 0 !important; 
            padding: 0 !important; 
            box-shadow: none !important; 
          }
          .print-header { 
            background: #1976d2 !important; 
            color: white !important; 
            padding: 20px !important; 
            margin-bottom: 20px !important; 
            border-radius: 8px !important; 
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print-paper { 
            box-shadow: none !important; 
            border: 1px solid #e0e0e0 !important; 
            margin-bottom: 20px !important; 
          }
          .print-page-break { 
            page-break-before: always; 
          }
          
          /* Ensure colors print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          .kpi-card {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
  
          /* Force the last card (Customer Rating) to start on a new page if it would split */
          .kpi-card:nth-child(7) {
            page-break-before: auto !important;
            break-before: auto !important;
          }
  
          /* Alternative: Target specifically by content */
          .customer-rating-card {
            page-break-before: auto !important;
            break-before: auto !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle className="no-print" sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <Typography variant="h4" fontWeight="bold">Driver Performance Report</Typography>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }} className="print-container">
          {/* Print Header */}
          <Box className="print-header" sx={{ display: 'none', '@media print': { display: 'block' } }}>
            <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ color: 'white' }}>
              Driver Performance Report
            </Typography>
          </Box>

          <Box sx={{ p: 4, background: 'linear-gradient(180deg, #f8f9ff 0%, #ffffff 100%)' }}>
            {/* Enhanced Header Section */}
            <Paper elevation={3} className="print-paper" sx={{ p: 4, mb: 4, borderRadius: 3 }}>
              <Grid container spacing={4} alignItems="center">
                {/* Driver Profile - Better Centered */}
                <Grid item xs={4} md={4}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Avatar src={displayData.avatarUrl} sx={{ 
                      width: 90, height: 90, mb: 2, bgcolor: theme.palette.primary.main,
                      fontSize: '2rem', border: `3px solid ${theme.palette.primary.light}`
                    }}>
                      {displayData.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 2, color: theme.palette.primary.main }}>
                      {displayData.name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center', minWidth: '200px' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <Business sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body1">{displayData.warehouseName}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <Email sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">{displayData.email}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                        <Phone sx={{ mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">{displayData.mobile}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Report Period */}
                <Grid item xs={4} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                      Report Period
                    </Typography>
                    <Paper elevation={1} sx={{ p: 2, mb: 2, background: `${theme.palette.primary.light}22` }}>
                      <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                        From: {formatDate(displayData.dateRange.from)}
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        To: {formatDate(displayData.dateRange.to)}
                      </Typography>
                    </Paper>
                    <Paper elevation={1} sx={{ p: 2, background: `${theme.palette.info.light}22` }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: theme.palette.info.main }}>
                        Completed Tours: {displayData.completedTours}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>

                {/* Overall Score */}
                <Grid  item xs={4} md={4}>
                  <Box sx={{ textAlign: 'center',width:'100%'}}>
                    <Typography variant="h2" sx={{ 
                      fontWeight: 'bold',
                      background: 'brown',
                      backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                      padding:0,
                      margin:0
                    }}>
                      {overallScore.toFixed(1)}/5
                    </Typography>
                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.secondary }}>
                      Overall Score
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Typography key={star} variant="h5" sx={{ 
                          color: star <= overallScore ? '#FFD700' : '#E0E0E0' 
                        }}>★</Typography>
                      ))}
                    </Box>
                    <Paper elevation={1} sx={{
                      px: 3, py: 1, borderRadius: 20,
                      background: `${overallAssessment.color}33`
                    }}>
                      <Typography variant="body1" fontWeight="bold" sx={{ color: overallAssessment.color }}>
                        {overallAssessment.level}
                      </Typography>
                    </Paper>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            {/* Charts Section */}
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={6} md={6}>
                <Paper elevation={3} className="print-paper" sx={{ p: 3, borderRadius: 3, height: 400 , width: '100%' }}>
                  <Typography variant="h6" gutterBottom textAlign="center" sx={{ 
                    color: theme.palette.primary.main, fontWeight: 'bold', mb: 3 
                  }}>
                    KPI Performance Overview
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} fontSize={10} interval={0} />
                      <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <RechartsTooltip formatter={(value) => [`${value}/5`, 'Score']} />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>

              <Grid item xs={6} md={6}>
                <Paper elevation={3} className="print-paper" sx={{ p: 3, borderRadius: 3, height: 400, width: '100%' }}>
                  <Typography variant="h6" gutterBottom textAlign="center" sx={{ 
                    color: theme.palette.primary.main, fontWeight: 'bold', mb: 3 
                  }}>
                    Performance Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                           label={({ name, value }) => `${name.split(' ')[0]}: ${value.toFixed(0)}%`}
                           labelLine={false} fontSize={9}>
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : value}%`, 'Performance']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>

            {/* KPI Details */}
            <Paper elevation={3} className="print-paper kpi-section" sx={{ p: 4, borderRadius: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ 
                textAlign: 'center', mb: 4, color: theme.palette.primary.main, fontWeight: 'bold' 
              }}>
                Detailed KPI Analysis
              </Typography>
              <Grid container spacing={3} className="kpi-grid-container">
                {kpiConfig.map((kpi, index) => (
                  <Grid item xs={12} sm={4} lg={4} key={index} className="kpi-card">
                    <Box sx={{
                      p: 3, borderRadius: 3, height: '100%', width: '100%',
                      background: `linear-gradient(135deg, ${kpi.color}08, ${kpi.color}03)`,
                      border: `1px solid ${kpi.color}`,
                      transition: 'transform 0.3s ease',
                      '&:hover': { transform: 'translateY(-2px)' }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Badge invisible={kpi.score < 4.5} badgeContent="★" color="secondary">
                          <Box sx={{
                            p: 1, borderRadius: '50%', background: `${kpi.color}22`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {React.cloneElement(kpi.icon, { sx: { color: kpi.color, fontSize: 24 } })}
                          </Box>
                        </Badge>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: kpi.color }}>
                            {kpi.label}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: kpi.color }}>
                            {kpi.score}/5
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ my: 2, backgroundColor: `${kpi.color}33` }} />
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                        {kpi.metric}
                      </Typography>
                      <Box sx={{
                        width: '100%', height: 6, backgroundColor: `${kpi.color}22`,
                        borderRadius: 3, overflow: 'hidden'
                      }}>
                        <Box sx={{
                          width: `${(kpi.score / 5) * 100}%`, height: '100%',
                          backgroundColor: kpi.color, transition: 'width 0.3s ease'
                        }} />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Overall Assessment */}
            <Paper elevation={3} className="print-paper" sx={{ 
              p: 4, borderRadius: 3,
              background: `linear-gradient(135deg, ${overallAssessment.color}08, ${overallAssessment.color}03)`,
              border: `3px solid ${overallAssessment.color}33`
            }}>
              <Typography variant="h4" gutterBottom textAlign="center" fontWeight="bold" sx={{ 
                color: theme.palette.primary.main, mb: 3 
              }}>
                Overall Assessment
              </Typography>
              
              <Box sx={{ p: 3, mb: 4, borderRadius: 3, background: 'rgba(255, 255, 255, 0.8)' }}>
                <Typography variant="h6" textAlign="center" sx={{ fontSize: '1.2rem', lineHeight: 1.8 }}>
                  {overallScore >= 4.5 ? 
                    `🎉 Outstanding performance! ${displayData.name} is excelling in most areas and is a top performer.` :
                   overallScore >= 3.5 ? 
                    `👍 Good performance overall. ${displayData.name} is performing well with some areas for improvement.` :
                    `📈 ${displayData.name} has potential but needs focused improvement in several key areas.`
                  }
                </Typography>
              </Box>
            </Paper>

            {/* Report Footer */}
            <Box sx={{ 
              mt: 4, p: 3, textAlign: 'center', 
              borderTop: `2px solid ${theme.palette.divider}`,
              background: `linear-gradient(135deg, ${theme.palette.grey[50]}, ${theme.palette.grey[100]})`
            }}>
              <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
                Report generated on {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })} at {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Sunniva Logistics Management System © 2025
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="no-print" sx={{ 
          p: 4, justifyContent: 'center',
          background: `linear-gradient(135deg, ${theme.palette.grey[50]}, ${theme.palette.grey[100]})`,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} 
                  sx={{ mr: 3, px: 5, py: 1.5, borderRadius: 25, fontSize: '1.1rem', fontWeight: 'bold' }}>
            Print Report
          </Button>
          <Button variant="outlined" onClick={onClose}
                  sx={{ px: 5, py: 1.5, borderRadius: 25,color:'#f7941d !important',fontSize: '1.1rem', fontWeight: 'bold',"&:hover": {
            background: "#f37021",
            color: 'white !important'
          }}}>
            Close Report
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DriverPerformanceReport;