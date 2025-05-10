import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Grid2,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PublishIcon from "@mui/icons-material/Publish";

import Camera from "../common/Camera";

const imageChecklist = ["Truck Image", "Odometer Image"];

const TripComplete = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [componentStatus, setComponentStatus] = useState<boolean[]>(
    new Array(imageChecklist.length).fill(false)
  );
  const [isAllComplied, setIsAllComplied] = useState(false);

  useEffect(() => {
    if (componentStatus.every((s) => s === true)) {
      setIsAllComplied(true);
    }
    console.log("Current Index", currentIndex);
    console.log("Component Status: ", componentStatus);
  }, [componentStatus]);

  const handleImageUploaded = (value: boolean) => {
    if (value) {
      setComponentStatus((prevState) => {
        const updated = [...prevState];
        updated[currentIndex] = true;
        return updated;
      });
      if (currentIndex < imageChecklist.length) {
        setCurrentIndex((v) => v + 1);
      }
    }
  };

  return (
    <Grid2 container spacing={0} p={0} height={"100%"}>
      <Grid2 height={"100%"} bgcolor={"#00695f"} size={{ sm: 8, md: 9, lg: 9 }}>
        <Camera
          buttonText={imageChecklist[currentIndex]}
          isComplied={isAllComplied}
          onImageUploaded={handleImageUploaded}
        />
      </Grid2>
      <Grid2 height={"100%"} bgcolor={"#009688"} size={{ sm: 4, md: 3, lg: 3 }}>
        <Stack
          display={"flex"}
          alignItems={"center"}
          justifyContent={"space-evenly"}
          height={"100%"}
          py={4}
        >
          {imageChecklist.map((value, index) => (
            <Box
              key={index}
              display="flex"
              flexDirection={"column"}
              justifyContent={"center"}
              alignItems={"center"}
              gap={1}
            >
              <IconButton>
                <Box
                  sx={{
                    perspective: 1000,
                    width: "6rem",
                    height: "6rem",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      transformStyle: "preserve-3d",
                      transition: "transform 0.9s",
                      transform: componentStatus[index]
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                      position: "relative",
                    }}
                  >
                    <Box
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid",
                        borderColor: "primary",
                        borderRadius: "50%",
                        // backgroundColor: "#00695f",
                        boxShadow: 3,
                      }}
                    >
                      <PublishIcon sx={{ fontSize: "6rem" }} />
                    </Box>

                    <Box
                      sx={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        // border: "1px solid",
                        // borderColor: "primary.main",
                        borderRadius: "50%",
                        backgroundColor: "#00695f",
                        boxShadow: 3,
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: "6rem" }} />
                    </Box>
                  </Box>
                </Box>
              </IconButton>
              <Typography variant="h5">{value}</Typography>
            </Box>
          ))}

          <Button
            disabled={!isAllComplied}
            variant="contained"
            sx={{
              //   position: "relative",
              padding: "6px 12px",
              borderRadius: 2,
              width: "12rem",
              minWidth: 180,
              maxWidth: 240,
              height: "4rem",
            }}
          >
            Complete
          </Button>
          {/* <Button
            variant="contained"
            sx={{
              position: "relative",
              padding: "6px 12px",
              borderRadius: 2,
              width: "20vw",
              minWidth: 180,
              maxWidth: 240,
              height: "9vh",
            }}
          >
            Complete
          </Button> */}
        </Stack>
      </Grid2>
    </Grid2>
  );
};

export default TripComplete;
