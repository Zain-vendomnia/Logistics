import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import adminApiService from "../../../services/adminApiService";

const OrdersUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await adminApiService.uploadOrdersFile(file);
      setMessage(`Success: ${res.message}`);
    } catch (err: any) {
      console.error("Upload error:", err);
      const errMsg =
        err.response?.data?.error || "Failed to upload file. Please try again.";
      setMessage(errMsg);
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.modal + 1 })}
        open={loading}
        // onClick={handleClose}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        p={0}
        // border="1px solid #ccc"
        // borderRadius={2}
        maxWidth={400}
        mx="auto"
        mt={4}
      >
        {/* <Typography variant="h6">Upload Orders File</Typography> */}

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? <CircularProgress size={24} /> : "Upload"}
        </Button>

        {message && (
          <Typography
            variant="body2"
            color={message.startsWith("Success") ? "green" : "red"}
          >
            {message}
          </Typography>
        )}
      </Box>
    </>
  );
};

export default OrdersUpload;
