import React from "react";
import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import * as AuthService from "./services/auth.service";
import IUser from "./types/user.type";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Profile from "./components/Profile";
import BoardAdmin from "./components/BoardAdmin";
import EventBus from "./common/EventBus";
import SuperAdmin from "./components/SuperAdmin";
import BoardDriver from "./components/BoardDriver/BoardDriver";
import RouteEstimateComponent from "./components/RouteEstimateComponent";
import { AppBar, Box, Button, Stack, Toolbar, Typography } from "@mui/material";
import SnackbarProvider from "./providers/SnackbarProvider";
import GlobalChecksProvider from "./providers/GlobalChecksProvider";

const App: React.FC = () => {
  const [showDriverBoard, setshowDriverBoard] = useState<boolean>(false);
  const [showAdminBoard, setShowAdminBoard] = useState<boolean>(false);
  const [showSuperAdminBoard, setShowSuperAdminBoard] =
    useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<IUser | undefined>(undefined);

  useEffect(() => {
    const user = AuthService.getCurrentUser();
    console.log("userdetails" + JSON.stringify(user));
    if (user) {
      setCurrentUser(user);
      setshowDriverBoard(user.role === "driver");
      setShowAdminBoard(user.role === "admin");
      setShowSuperAdminBoard(user.role === "super_admin");
    }

    EventBus.on("logout", logOut);

    return () => {
      EventBus.remove("logout", logOut);
    };
  }, []);

  const logOut = () => {
    localStorage.removeItem("user");
    AuthService.logout();
    setshowDriverBoard(false);
    setShowAdminBoard(false);
    setShowSuperAdminBoard(false);
    setCurrentUser(undefined);
  };

  return (
    <SnackbarProvider>
      <GlobalChecksProvider>
        <>
          <AppBar
            position="sticky"
            sx={{
              bgcolor: "primary",
              height: 50,
              boxShadow: "0px 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <Toolbar sx={{ minHeight: "50px !important", paddingX: 2 }}>
              <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
                {showDriverBoard && (
                  <Typography variant="h6" sx={{ mr: 2 }}>
                    Driver Interface
                  </Typography>
                )}

                {showAdminBoard && (
                  <Button color="inherit" component={Link} to="/admin">
                    Admin Board
                  </Button>
                )}

                {showSuperAdminBoard && (
                  <Button color="inherit" component={Link} to="/super_admin">
                    Super Admin
                  </Button>
                )}
              </Box>

              {currentUser ? (
                <Stack direction="row" spacing={2}>
                  {currentUser.username === "superadmin" && (
                    <>
                      <Button color="inherit" component={Link} to="/register">
                        Sign Up
                      </Button>
                      <Button color="inherit" onClick={logOut}>
                        LogOut
                      </Button>
                    </>
                  )}

                  {(currentUser.username === "admin" ||
                    currentUser.role === "driver") && (
                    <>
                      <Button color="inherit" component={Link} to="/profile">
                        Profile
                      </Button>
                      <Button color="inherit" onClick={logOut}>
                        LogOut
                      </Button>
                    </>
                  )}
                </Stack>
              ) : (
                <Button color="inherit" component={Link} to="/login">
                  Login
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <div className="flex-1 p-6">
            {" "}
            {/* container w-full max-w-full */}
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/home" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/superadmin" element={<SuperAdmin />} />
              <Route path="/driver" element={<BoardDriver />} />
              <Route path="/admin" element={<BoardAdmin />} />
              <Route
                path="/api/estimate"
                element={<RouteEstimateComponent />}
              />
            </Routes>
          </div>
        </>
      </GlobalChecksProvider>
    </SnackbarProvider>
  );
};

export default App;
