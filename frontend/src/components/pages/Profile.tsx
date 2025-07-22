import React from "react";
import { isDriver } from "../../types/user.type";
import { Box, Skeleton } from "@mui/material";
import { useAuth } from "../../providers/AuthProvider";

const DriverProfile = React.lazy(() => import("../driver/DriverProfile"));
const AdminProfile = React.lazy(() => import("../Admin/AdminProfile"));

const ProfileSkeleton = () => {
  return (
    <Box
      display={"flex"}
      justifyContent={"center"}
      alignItems={"center"}
      pt={4}
    >
      <Skeleton variant="rectangular" width={550} height={500} />
    </Box>
  );
};

const Profile = () => {
  const { user } = useAuth();

  if (!user) return <div> Loading profile...</div>;

  return (
    <Box height="100%">
      {/* <React.Suspense fallback={<ProfileSkeleton />}>
      </React.Suspense> */}
      {isDriver(user) ? <DriverProfile /> : <AdminProfile />}
    </Box>
  );
};

export default Profile;
