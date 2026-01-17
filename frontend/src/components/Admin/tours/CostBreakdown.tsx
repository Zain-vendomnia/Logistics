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
      <Typography variant="body1" fontWeight={"bold"}>
        Cost Breakdown
      </Typography>
      <TableContainer>
        <Table
          aria-label="side header table"
          size="small"
          sx={{
            "& td": { fontSize: "1rem", px: 0.5 },
            "& th": { fontSize: "1rem", fontWeight: "bold" },
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell />
              {/* {rows.map((row) => (
              <TableCell key={row.name} align="center">
                {row.name}
              </TableCell>
            ))} */}
              <TableCell align="center">(Є)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {headers.map((header, i) => (
              <TableRow key={header}>
                {/* Header in the first column */}
                <TableCell component="th" scope="row" align="left">
                  {header}
                </TableCell>
                {/* Values for each row */}
                <TableCell align="center">{dataSet[i]}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell component="th" scope="row" align="left">
                Total
              </TableCell>
              <TableCell align="center">Є {tourMatrix?.totalCost}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
};

export default CostBreakdown;
