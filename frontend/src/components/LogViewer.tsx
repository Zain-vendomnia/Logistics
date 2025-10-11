import React, { useEffect, useMemo, useRef, useState } from "react";
import socket from "../socket/socketInstance";
import { motion } from "framer-motion";
import Paper from "@mui/material/Paper/Paper";
import List from "@mui/material/List/List";
import Divider from "@mui/material/Divider/Divider";
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  LinearProgress,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import theme from "../theme";
import { fetchLogs } from "../services/adminApiService";

interface LogEntry {
  timestamp: string;
  message: string;
  level: "info" | "warning" | "error" | "debug";
  module?: string;
}

interface ProgressEntry {
  task: string;
  status: "in-progress" | "completed" | "failed";
  progress: number; // 0 to 100
  details?: any;
  timestamp: string;
}

const levelColors: Record<
  string,
  "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"
> = {
  info: "info",
  warning: "warning",
  error: "error",
  debug: "default",
  success: "success",
};

const LogViewer = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [progressTasks, setProgressTasks] = useState<ProgressEntry[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const logEndRef = useRef<HTMLDivElement>(null);

  const handleAppConnection = (log: any) => {
    console.log("[App connection]:", log);
    setLogs((prev) => [...prev, log]);
  };
  const handleLogMessage = (log: LogEntry) => {
    console.log("[Log message]:", log);
    setLogs((prev) => [...prev, log]);
  };
  const handleTaskProgress = (progress: ProgressEntry) => {
    setProgressTasks((prev) => {
      const idx = prev.findIndex((p) => p.task === progress.task);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = progress;
        return updated;
      }
      return [...prev, progress];
    });
  };

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const logs = await fetchLogs();
        setLogs(logs);
        console.log("logs: ", logs);
      } catch (error) {
        console.log(`Failed to fetch logs: ${error}`);
      }
    };

    loadLogs();
    console.log(`[LogViewer] listening for log events...`);

    socket.on("app-connection", handleAppConnection);
    socket.on("log-message", handleLogMessage);
    socket.on("task-progress", handleTaskProgress);

    return () => {
      socket.off("app-connection", handleAppConnection);
      socket.off("log-message", handleLogMessage);
      socket.off("task-progress", handleTaskProgress);
    };
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = levelFilter ? log.level === levelFilter : true;
      const matchesSearch = searchTerm
        ? log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.module?.toLowerCase().includes(searchTerm.toLowerCase()) ??
            false)
        : true;
      return matchesLevel && matchesSearch;
    });
  }, [logs, searchTerm, levelFilter]);

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: "100%",
        overflowY: "auto",
        bgcolor: "#1e1e1e",
        color: "white",
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h5" gutterBottom color="success.main">
        Live Orchestration Logs
      </Typography>

      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <TextField
          size="small"
          variant="outlined"
          placeholder="Search message or module..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            flex: 1,
            input: {
              color: "#fff", // text color
              "&::placeholder": { color: "rgba(255,255,255,0.7)" },
            },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255,255,255,0.5)" },
              "&:hover fieldset": { borderColor: theme.palette.primary.dark },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.dark,
              },
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel sx={{ color: "white" }}>Level</InputLabel>
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            label="Level"
            sx={{
              color: "white",
              "& .MuiSvgIcon-root": {
                color: "white",
              },
            }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="info">INFO</MenuItem>
            <MenuItem value="warn">WARN</MenuItem>
            <MenuItem value="error">ERROR</MenuItem>
            <MenuItem value="debug">DEBUG</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {progressTasks.map((task, i) => (
        <Box key={i} mb={2}>
          <Typography variant="body2" color="gray">
            {task.timestamp} - {task.task}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={task.progress}
            sx={{ height: 10, borderRadius: 2, mt: 0.5 }}
          />
          {task.details && (
            <Typography variant="caption" color="lightgray">
              {JSON.stringify(task.details)}
            </Typography>
          )}
        </Box>
      ))}

      <Divider />
      <List sx={{ flex: 1, overflowY: "auto" }}>
        {filteredLogs.map((log, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ListItem alignItems="flex-start" sx={{ py: 0.5 }}>
              <ListItemText
                primary={
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Typography variant="body2" color="gray">
                      {log.timestamp}
                    </Typography>
                    {log.module && (
                      <Chip
                        label={log.module}
                        size="small"
                        color="primary"
                        sx={{ fontSize: 12 }}
                      />
                    )}
                    <Chip
                      label={log.level}
                      size="small"
                      color={levelColors[log.level] ?? "default"}
                      sx={{ fontSize: 12 }}
                    />
                  </Box>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: "lightgray" }}>
                    {log.message}
                  </Typography>
                }
              />
            </ListItem>
            {i < logs.length - 1 && <Divider sx={{ borderColor: "#333" }} />}
          </motion.div>
        ))}
        <div ref={logEndRef} />
      </List>
    </Paper>
  );
};

export default LogViewer;
