import React from "react";
import { useState, useEffect } from "react";
import { Routes, Route, Link, Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import * as AuthService from "./services/auth.service";
import IUser from './types/user.type';
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Profile from "./components/Profile";
import BoardAdmin from "./components/BoardAdmin";
import EventBus from "./common/EventBus";
import SuperAdmin from "./components/SuperAdmin";
import BoardDriver from "./components/BoardDriver";


const App: React.FC = () => {
  const [showDriverBoard, setshowDriverBoard] = useState<boolean>(false);
  const [showAdminBoard, setShowAdminBoard] = useState<boolean>(false);
  const [showSuperAdminBoard, setShowSuperAdminBoard] = useState<boolean>(false);
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
    <div>
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="navbar-nav mr-auto">
          {showDriverBoard && (
            <li className="nav-item" style={{color:"#FFFFFF"}}>
                Driver Interface
            </li>
          )}

          {showAdminBoard && (
            <li className="nav-item">
              <Link to={"/admin"} className="nav-link">
                Admin Board
              </Link>
            </li>
          )}

          {showSuperAdminBoard && (
            <li className="nav-item">
              <Link to={"/super_admin"} className="nav-link">
                Super Admin
              </Link>
            </li>
          )}
        </div>

        {currentUser ? (
          <div className="navbar-nav ml-auto">
            {/* If the user is a superadmin */}
            {currentUser.username === "superadmin" && (
              <>
                <li className="nav-item">
                  <Link to={"/register"} className="nav-link">
                    Sign Up
                  </Link>
                </li>
                <li className="nav-item">
                  <a href="/login" className="nav-link" onClick={logOut}>
                    LogOut
                  </a>
                </li>
              </>
            )}

            {/* If the user is an admin */}
            {currentUser.username === "admin" && (
              <>
                <li className="nav-item">
                  <Link to={"/profile"} className="nav-link">
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <a href="/login" className="nav-link" onClick={logOut}>
                    LogOut
                  </a>
                </li>
              </>
            )}
            {/* If the user is a driver */}
            {currentUser.role === "driver" && (
              <>
               <li className="nav-item">
                  <Link to={"/profile"} className="nav-link">
                    Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <a href="/login" className="nav-link" onClick={logOut}>
                    LogOut
                  </a>
                </li>
              </>
            )}
          </div>
        ) : (
          <div className="navbar-nav ml-auto">
            {/* Default guest view */}
            <li className="nav-item">
              <Link to={"/login"} className="nav-link">
                Login
              </Link>
            </li>
          </div>
        )}
      </nav>
<<<<<<< Updated upstream
      <div className="flex-1 p-6"> {/* container w-full max-w-full */}
=======
      <div className="maincontainer">
>>>>>>> Stashed changes
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="/driver" element={<BoardDriver />} />
          <Route path="/admin" element={<BoardAdmin />} />
        </Routes>
      </div>   
    </div>
  );
};

export default App;
