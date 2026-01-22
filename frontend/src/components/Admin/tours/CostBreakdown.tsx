import React from "react";
import { TourMatrix } from "../../../types/tour.type";
import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

interface Props {
  tourMatrix: TourMatrix | null | undefined;
}

const CostBreakdown = ({ tourMatrix }: Props) => {
  const style = {
    fontSize: "0.9rem",
  };

  const headers = [
    "Cost/Stop",
    "Cost/BKW",
    "Cost/SLMD",
    "Vehicle/Van",
    "Diesel",
    "Personnel",
    // "Warehouse",
    "Infeed",
    "Hotel",
    "WE Tour",
    "WA Tour",
  ];

  if (!tourMatrix) return null;

  const dataSet = [
    tourMatrix?.costPerStop,
    tourMatrix?.costPerArticle,
    tourMatrix?.costPerSLMD,
    tourMatrix?.vanTourCost,
    tourMatrix?.dieselTourCost,
    tourMatrix?.personnelTourCost,
    // tourMatrix?.warehouseTourCost,
    tourMatrix?.infeedTourCost,
    tourMatrix?.hotelCost,
    tourMatrix?.costWE,
    tourMatrix?.costWA,
  ];

  return (
    <Stack spacing={0} mt={2}>
      <Typography variant="h6" fontWeight={"bold"}>
        Cost Breakdown
      </Typography>

      <Table
        aria-label="side header table"
        size="small"
        sx={{
          "& td": { fontSize: style.fontSize, px: 0.5 },
          "& th": {
            fontSize: style.fontSize,
            fontWeight: "bold",
            align: "left",
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell />
            <TableCell align="center">(Є)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {headers.map((header, i) => (
            <TableRow key={header}>
              <TableCell align="left">{header}</TableCell>
              <TableCell />
              <TableCell align="center">{dataSet[i]}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell align="left" component={"th"}>
              Total
            </TableCell>
            <TableCell />
            <TableCell align="center" component={"th"}>
              {tourMatrix?.totalCost}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Stack>
  );
};

export default CostBreakdown;
