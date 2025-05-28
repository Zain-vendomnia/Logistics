import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Tabs, Tab, Paper } from "@mui/material";
import TourTable from "./TourTable";
import { getAllTours } from "../../services/tourService";

const TourManagement = () => {
  const [tours, setTours] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTours = useCallback(async () => {
    const response = await getAllTours({
      status,
      search: debouncedSearch,
      page: page + 1, // 1-indexed
      limit: pageSize,
    });
    setTours(response.data || []);
    setTotalCount(response.total || 0);
  }, [status, debouncedSearch, page, pageSize]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Manage Tours
      </Typography>

      <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs
          value={status}
          onChange={(_, newStatus) => {
            setStatus(newStatus);
            setPage(0);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="ALL" value="all" />
          <Tab label="PENDING" value="pending" />
          <Tab label="COMPLETED" value="completed" />
          <Tab label="CANCELED" value="canceled" />
        </Tabs>
      </Paper>

      <TourTable
        tours={tours}
        search={search}
        setSearch={setSearch}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        rowCount={totalCount}
      />
    </Box>
  );
};

export default TourManagement;
