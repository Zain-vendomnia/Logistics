import React, { useEffect, useRef, useState } from "react";
import { Box, Divider, Stack, Typography, IconButton } from "@mui/material";
import { grey } from "@mui/material/colors";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ReplayIcon from "@mui/icons-material/Replay";

import { motion } from "framer-motion";

import {
  NotificationSeverity,
  useNotificationStore,
} from "../../store/useNotificationStore";
import { uploading, loadingPulse } from "../base-ui/motionPresets";

interface Props {
  onFileSrc?: (fileData: string) => void;
}
const UploadPermitScreenshot = ({ onFileSrc }: Props) => {
  const { showNotification } = useNotificationStore();
  const iconSize = "4rem";
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFileUploadedOnce, setIsFileUploadedOnce] = useState(false);

  useEffect(() => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      onFileSrc?.(base64String);
    };

    reader.readAsDataURL(file);
  }, [file]);

  const handleFileUplaod = () => {
    if (!file) return;

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      showNotification({
        message: `${file.name} uploaded successfully!`,
        severity: NotificationSeverity.Info,
      });
      setFile(null);
      setIsFileUploadedOnce(true);
    }, 2000);
  };

  const handleFileButtonClick = () => {
    if (file) {
      handleFileUplaod();
    } else {
      fileRef.current?.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleFileReselect = () => {
    setFile(null);
    fileRef.current?.click();
  };

  const animationVariant = isLoading
    ? uploading
    : file || !isFileUploadedOnce
      ? loadingPulse
      : undefined;

  return (
    <>
      <Stack spacing={3}>
        <Typography variant="h6">Permit Screenshot</Typography>

        <Box display="flex" gap={2} justifyContent={"space-evenly"}>
          <input
            type="file"
            ref={fileRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
            accept="image/*"
          />

          {isFileUploadedOnce && !file && (
            <Typography variant="body2" color="primary.main" maxWidth="105px">
              Uploaded successfully!
            </Typography>
          )}

          {file && (
            <Box
              display={"flex"}
              alignItems={"flex-start"}
              minWidth="150px"
              maxWidth={"225px"}
            >
              <Typography fontSize={"1.3rem"}>{file.name}</Typography>
              <IconButton
                onClick={handleFileReselect}
                sx={{ p: 0, ml: "auto" }}
              >
                <ReplayIcon sx={{ color: "#000" }} />
              </IconButton>
            </Box>
          )}

          <IconButton
            onClick={handleFileButtonClick}
            sx={{
              position: "relative",
              border: "2px solid",
              borderRadius: 50,
              color: file || isFileUploadedOnce ? "primary.dark" : grey[600],
              borderColor: "primary.dark",
              width: "84px",
              height: "84px",
              overflow: "hidden",
              boxShadow: 6,
              ...((isFileUploadedOnce || !file) && {
                "&:hover, &:focus": {
                  transform: "scale(1.05)",
                  transition: "transform 0.3s ease-in-out",
                },
              }),
            }}
          >
            <motion.div
              variants={animationVariant}
              animate={animationVariant ? "animate" : {}}
              style={{ opacity: 1, y: 0 }}
            >
              <FileUploadIcon sx={{ fontSize: iconSize, opacity: 1 }} />
            </motion.div>
          </IconButton>
        </Box>

        <Divider color={grey[100]} />
      </Stack>
    </>
  );
};

export default UploadPermitScreenshot;
