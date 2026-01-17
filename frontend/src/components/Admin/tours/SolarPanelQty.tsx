import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Tourinfo } from "../../../types/tour.type";

interface Props {
  tour: Tourinfo;
}
const SolarPanelQty = ({ tour }: Props) => {
  const showWeightChart = (
    <Box>
      <Typography variant="subtitle2">1 x SLMDL500 = 6kg</Typography>
      <Typography variant="subtitle2">1 x SLMDL450 = 5.5kg</Typography>
      <Typography variant="subtitle2">1 x SLMDL415 = 5kg</Typography>
    </Box>
  );

  return (
    <Box display={"flex"} flexDirection={"column"}>
      <Typography fontWeight={"bold"}>Solar Panels</Typography>

      <Table
        size="small"
        sx={{
          "& td": { fontSize: "1rem", px: 0.5 },
        }}
      >
        <TableRow>
          <TableCell align="left">
            Article
            <Tooltip
              title={showWeightChart}
              arrow
              placement="top"
              enterTouchDelay={300}
              leaveTouchDelay={3000}
              componentsProps={{
                tooltip: {
                  sx: {
                    bgcolor: "background.paper",
                    color: "text.primary",
                    boxShadow: 3,
                    borderRadius: 2,
                    p: 1.5,
                    maxWidth: 260,
                  },
                },
                arrow: {
                  sx: {
                    color: "background.paper",
                  },
                },
              }}
            >
              <IconButton>
                <HelpOutlineIcon color="primary" fontSize="small" />
              </IconButton>
            </Tooltip>
          </TableCell>
          <TableCell align="center">Qty</TableCell>
          <TableCell align="center">Wt/kg</TableCell>
        </TableRow>
        <TableBody>
          {/* {ItemRows.map((row, idx) => ( */}
          <TableRow key={0}>
            <TableCell align="left">
              {/* {row.article} */}
              SLMDL415
            </TableCell>
            <TableCell align="center">
              {/* {row.quantity} */}
              25
            </TableCell>
            <TableCell align="center">
              {/* {row.quantity} */}
              137.5
            </TableCell>
          </TableRow>
          <TableRow key={0}>
            <TableCell align="left">
              {/* {row.article} */}
              SLMDL400
            </TableCell>
            <TableCell align="center">
              {/* {row.quantity} */}
              28
            </TableCell>
            <TableCell align="center">
              {/* {row.quantity} */}
              140
            </TableCell>
          </TableRow>
          {/* total */}
          <TableRow key={0}>
            <TableCell align="left" sx={{ fontWeight: "bold" }}>
              {/* {row.article} */}
              Total
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              {/* {row.quantity} */}
              53
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: "bold" }}>
              {/* {row.quantity} */}
              227.5
            </TableCell>
          </TableRow>
          {/* ))} */}
        </TableBody>
      </Table>
    </Box>
  );
};

export default SolarPanelQty;
