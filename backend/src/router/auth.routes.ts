import { Router } from "express";
import validateToken from "../middlewares/validateToken";
import roleCheck from "../middlewares/roleCheck";

import * as AuthCtrl from "../controller/auth.controller";
import * as UserCtrl from "../controller/user.controller";
import * as DriverCtrl from "../controller/driver.controller";

const authRouter = Router();

// Route to sign up a new user - no role check needed, anyone can sign up
authRouter.post("/signup", AuthCtrl.signup);

// Route to log in and get a JWT token - no role check needed, anyone can log in
authRouter.post("/login", AuthCtrl.login);

// Route to get user details - only accessible if the token is valid
authRouter.get("/user", validateToken, UserCtrl.getUserDetails);

// Route to fetch all users (admin-only access)
//router.get("/admin", validateToken, roleCheck(["admin"]), userCtrl.getAllUsers);
authRouter.get("/admin", validateToken, roleCheck(["admin"]), (_req, res) => {
  // If authenticated and authorized, render the admin page
  res.render("admin");
});

// Route to get driver board, only accessible to drivers
authRouter.get(
  "/test/driver",
  validateToken,
  roleCheck(["driver"]),
  DriverCtrl.getDriverBoard
);

// Validate token (used to check if user is still logged in)
authRouter.get("/validate-token", validateToken, (_req, res) => {
  res.status(200).json({ message: "Token is valid" });
});
export default authRouter;
