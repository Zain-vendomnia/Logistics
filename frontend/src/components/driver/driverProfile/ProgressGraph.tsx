import React, { useEffect, useMemo, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import type { HighlightScope } from "@mui/x-charts/context";

import dayjs, { Dayjs } from "dayjs";
// If you need a specific timezone, add utc/timezone plugins and set default TZ.

// ===================== Types =====================
type DailyRow = {
  date: string; // "YYYY-MM-DD"
  kpi3PODScore?: number;
  kpi6FuelEfficiencyScore?: number;
  kpi5TimeScore?: number;
  kpi7CustomerRating?: number;
};

type ChartState = {
  xAxisData: string[]; // YYYY-MM-DD for each day in range
  pod: number[];
  fuel: number[];
  time: number[];
  rating: number[];
};

// ===================== Date helpers =====================
function fmtYmd(d: Dayjs) {
  return d.format("YYYY-MM-DD");
}

// Sunday → Saturday for "this week" (local time)
function getSunToSatRange(ref?: Dayjs) {
  const base = (ref ?? dayjs()).startOf("day");
  const sunday = base.startOf("week"); // Sunday 00:00
  const saturday = base.endOf("week"); // Saturday 23:59:59
  return {
    startDate: fmtYmd(sunday),
    endDate: fmtYmd(saturday),
  };
}

function daysBetweenInclusive(startYmd: string, endYmd: string): string[] {
  const out: string[] = [];
  let d = dayjs(startYmd);
  const end = dayjs(endYmd);
  while (d.isSame(end) || d.isBefore(end)) {
    out.push(fmtYmd(d));
    d = d.add(1, "day");
  }
  return out;
}

// ===================== Data shaping =====================
// Expecting daily objects with `date` and KPI fields.
// If backend sends weekly aggregate (no `date`), we fill zeros for the week.
function normalizeDailyResponse(
  resp: any,
  orderedDates: string[]
): ChartState {
  const init = {
    xAxisData: orderedDates,
    pod: orderedDates.map(() => 0),
    fuel: orderedDates.map(() => 0),
    time: orderedDates.map(() => 0),
    rating: orderedDates.map(() => 0),
  };

  if (!Array.isArray(resp) || resp.length === 0) return init;

  // Is it daily?
  if ("date" in (resp[0] || {})) {
    const byDate = new Map<string, DailyRow>();
    for (const r of resp as DailyRow[]) {
      if (!r?.date) continue;
      byDate.set(r.date, r);
    }
    const pod: number[] = [];
    const fuel: number[] = [];
    const time: number[] = [];
    const rating: number[] = [];

    for (const d of orderedDates) {
      const row = byDate.get(d);
      pod.push(Number(row?.kpi3PODScore ?? 0));
      fuel.push(Number(row?.kpi6FuelEfficiencyScore ?? 0));
      time.push(Number(row?.kpi5TimeScore ?? 0));
      rating.push(Number(row?.kpi7CustomerRating ?? 0));
    }

    return { xAxisData: orderedDates, pod, fuel, time, rating };
  }

  // Weekly aggregate fallback → keep zeros; encourage backend to return daily rows.
  console.warn(
    "[ProgressGraph] API returned weekly aggregate. To show daily bars, return one object per day with { date, kpi3PODScore, kpi6FuelEfficiencyScore, kpi5TimeScore, kpi7CustomerRating }."
  );
  return init;
}

// ===================== Component =====================
const ProgressGraph: React.FC = () => {
  const [highlight, setHighlight] = useState<HighlightScope["highlight"]>("item");
  const [fade, setFade] = useState<HighlightScope["fade"]>("global");

  const { startDate, endDate } = useMemo(() => getSunToSatRange(), []);
  const weekDates = useMemo(() => daysBetweenInclusive(startDate, endDate), [startDate, endDate]);

  const [chart, setChart] = useState<ChartState>(() =>
    normalizeDailyResponse([], weekDates)
  );

  useEffect(() => {
    const ac = new AbortController();

    const run = async () => {
      try {
        const raw = localStorage.getItem("user");
        if (!raw) return;

        const { driver_id: driverId, accessToken } = JSON.parse(raw) || {};
        if (!driverId) return;

        const qs = new URLSearchParams({
          startDate,
          endDate,
          driver_id: String(driverId),
        });

        const res = await fetch(
          `http://localhost:8080/api/driver/week-performance?${qs.toString()}`,
          {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            signal: ac.signal,
          }
        );

        if (!res.ok) {
          console.error("Performance fetch failed:", await res.text());
          return;
        }

        const data = await res.json();
        setChart(normalizeDailyResponse(data, weekDates));
      } catch (err) {
        if ((err as any).name !== "AbortError") console.error(err);
      }
    };

    run();
    return () => ac.abort();
  }, [startDate, endDate, weekDates]);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">
          Progress Graph (Sun {dayjs(startDate).format("DD MMM")} – Sat {dayjs(endDate).format("DD MMM")})
        </Typography>
        <IconButton>
          <MoreHorizIcon fontSize="small" />
        </IconButton>
      </Box>

      <BarChart
        series={[
          {
            label: "POD Score",
            data: chart.pod,
            highlightScope: { highlight, fade } as HighlightScope,
          },
          {
            label: "Fuel Efficiency",
            data: chart.fuel,
            highlightScope: { highlight, fade } as HighlightScope,
          },
          {
            label: "Time Management",
            data: chart.time,
            highlightScope: { highlight, fade } as HighlightScope,
          },
          {
            label: "Customer Rating",
            data: chart.rating,
            highlightScope: { highlight, fade } as HighlightScope,
          },
        ]}
        xAxis={[
          {
            data: chart.xAxisData,
            scaleType: "band",
            valueFormatter: (val: string) =>
              dayjs(val, "YYYY-MM-DD", true).isValid()
                ? dayjs(val).format("DD MMM")
                : val,
          },
        ]}
        height={350}
        sx={{ mt: "auto" }}
      />
    </Box>
  );
};

export default ProgressGraph;
