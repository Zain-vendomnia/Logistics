import React, { useEffect, useRef, useState } from "react";

import {
  alpha,
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import EditIcon from "@mui/icons-material/Edit";

import CameraCapture from "../../common/Camera_Capture";
import { ImageType } from "../../../hooks/useCameraCapture";
import { ModalWrapper } from "../../common/ModalWrapper";
import {
  getCurrentUser,
  getProfileImage,
  setProfileImage,
} from "../../../services/auth.service";
import createFormBuilder from "../../../fn/createFormBuilder";

type UploadState = "idle" | "show_options" | "file_upload" | "camera_upload";
type Events = "click" | "file_upload";

const style = {
  box_layout: {
    bgcolor: grey[200],
    border: "2px solid",
    borderColor: grey[500],
    borderRadius: 4,
    p: 2,
  },
  uploadOptions_box: {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
  },
  uploadOptions_list: {
    position: "absolute",
    top: "100%",
    right: 0,
    mt: 1,
    bgcolor: alpha(grey[700], 0.7),
    color: "white",
    boxShadow: 3,
    borderRadius: 1,
    zIndex: 10,
    width: 180,
    minWidth: 120,
    py: 0.5,
  },
  uploadOptions_Button: {
    color: "white",
    fontSize: "1rem",
    textTransform: "none",
    p: 1,
    justifyContent: "flex-end",
  },
};

const DriverProfileDetails = () => {
  const space = 1;
  const [user, setUser] = useState<any>(null);
  const [profileImageSrc, setProfileImageSrc] = useState<string>("");

  const [showUploadModal, setShowUploadModal] = useState(false);
  const imageFileRef = useRef<HTMLInputElement | null>(null);
  const [imageFile, setImageFile] = useState<string>("");
  const [isImageFileUploaded, setIsImageFileUploaded] = useState(false);

  const [showCameraModal, setShowCameraModal] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);

    const imgSrc = getProfileImage();
    setProfileImageSrc(imgSrc);
  }, []);

  useEffect(() => {
    if (!showUploadModal || !showCameraModal) {
      setImageFile("");
      // setIsImageFileUploaded(false);
    }
  }, [showUploadModal, showCameraModal]);

  const handleImageUpload = (base64: string) => {
    if (!base64) return;

    // Update Auth service
    setProfileImage(base64);

    // Update local State
    setProfileImageSrc(base64);
    // setShowCameraModal(false);

    setShowUploadModal(false);
    setShowCameraModal(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImageFile(base64);
      };

      // setIsImageFileUploaded(true);
    }
  };

  const cancelImageUplaod = () => {
    setShowUploadModal(false);
    setImageFile("");
    // setIsImageFileUploaded(false);
    // setOpenCamera(false);
  };

  const [showOptions, setShowOptions] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const fields = [
    { name: "username", label: "User Name", type: "text" },
    { name: "password", label: "Password", type: "password" },
    { name: "remember", label: "Remember", type: "radio" },
  ];
  const loginForm = createFormBuilder(fields);
  const handleFormSubmit = (data: any) => {
    console.log(data);
  };

  return (
    <>
      {/* <ModalWrapper onClose={() => {}}>
        {React.createElement(loginForm, { onSubmit: handleFormSubmit })}
      </ModalWrapper> */}

      <input
        type="file"
        accept="image/*"
        ref={imageFileRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <Stack spacing={space + 1} alignItems={"center"} sx={style.box_layout}>
        <Box sx={style.uploadOptions_box}>
          <Box
            component={"img"}
            src={profileImageSrc}
            alt="client_image"
            sx={{
              height: "175",
              width: "175px",
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />

          <Box
            ref={menuRef}
            sx={{ position: "absolute", right: "0", top: "0" }}
          >
            <IconButton
              onClick={() => setShowOptions(!showOptions)}
              sx={{
                bgcolor: "grey.300",
                "&:hover, &:focus": { bgcolor: "primary.main", color: "white" },
              }}
            >
              <EditIcon />
            </IconButton>

            {showOptions && (
              <List sx={style.uploadOptions_list}>
                <ListItem disablePadding>
                  <Button
                    fullWidth
                    onClick={() => setShowUploadModal(true)}
                    sx={style.uploadOptions_Button}
                  >
                    Upload Photo
                  </Button>
                </ListItem>
                <ListItem disablePadding>
                  <Button
                    fullWidth
                    onClick={() => setShowCameraModal(true)}
                    sx={style.uploadOptions_Button}
                  >
                    Take Photo
                  </Button>
                </ListItem>
              </List>
            )}
          </Box>
        </Box>

        <Typography variant="h5" fontWeight="bold">
          {user?.username}
        </Typography>

        <Box
          display="flex"
          flexDirection={"column"}
          alignItems={"flex-start"}
          gap={0}
          width={"100%"}
        >
          <Typography variant="h6" fontWeight="bold">
            Email:
          </Typography>
          <Typography
            variant="body1"
            sx={{ overflowWrap: "break-word", wordBreak: "break-word" }}
          >
            {user?.email}
          </Typography>
        </Box>
      </Stack>

      <Stack sx={style.box_layout} alignItems={"center"}>
        <Typography variant="h6" fontWeight={"bold"}>
          Driving License
        </Typography>
        <Box
          component={"img"}
          src="./driving_license.png"
          alt="client_image"
          sx={{
            height: "14rem",
            width: "14rem",
          }}
        />
      </Stack>

      {showCameraModal && (
        <ModalWrapper
          open={showCameraModal}
          onClose={() => setShowCameraModal(false)}
        >
          <Stack spacing={2} alignItems={"center"}>
            <Box>
              <CameraCapture
                imageType={ImageType.Profile_Image}
                showCameraIcon={true}
                buttonText="Take Picture"
                styleCard={false}
                onImageUploaded={(imgSrc) => handleImageUpload(imgSrc)}
              />
            </Box>
          </Stack>
        </ModalWrapper>
      )}

      {showUploadModal && (
        <ModalWrapper
          title={"Update Profile Picture"}
          open={showUploadModal}
          onClose={cancelImageUplaod}
        >
          <Stack spacing={2} alignItems={"center"}>
            <Box
              display={"flex"}
              alignItems={"center"}
              justifyContent={"center"}
              height={225}
              width={225}
              border="2px solid"
              borderRadius={"50%"}
              borderColor={grey[500]}
              boxShadow={2}
            >
              <Box
                component={"img"}
                src={imageFile || profileImageSrc}
                alt="client_image"
                sx={{
                  // height: "75%",
                  // width: "75%",
                  height: "175",
                  width: "175px",
                  borderRadius: "50%",
                }}
              />
            </Box>

            {/* Buttons */}
            <Box display={"flex"} justifyContent={"center"} gap={2}>
              {imageFile ? (
                <>
                  <Button
                    variant="contained"
                    onClick={() => handleImageUpload(imageFile)}
                  >
                    Confirm
                  </Button>{" "}
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    onClick={() => imageFileRef.current?.click()}
                    // sx={{ height: "2rem" }}
                  >
                    Uplaod
                  </Button>
                </>
              )}
              <Button variant="contained" onClick={cancelImageUplaod}>
                Cancel
              </Button>
            </Box>
          </Stack>
        </ModalWrapper>
      )}
    </>
  );
};

export default DriverProfileDetails;
