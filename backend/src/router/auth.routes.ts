import { Router } from "express";
import * as authCtrl from "../controller/auth.controllet";
import validateToken from "./validateToken";
import * as userCtrl from "../controller/user.controller";
import roleCheck  from "../middlewares/roleCheck";
import * as xroutemap from "../controller/xroutemap"; // Import the new controller

const router = Router();
// Route to get user details - only accessible if the token is valid
// This can be accessible by anyone with a valid token, regardless of role
router.get("/user", validateToken, userCtrl.getUserDetails);

// Route to sign up a new user - no role check needed, anyone can sign up
router.post("/signup", authCtrl.signup);

// Route to log in and get a JWT token - no role check needed, anyone can log in
router.post("/login", authCtrl.login);

router.get( "/all", userCtrl.getUserDetails);

// Example of an admin-only route to get all users, only accessible by admins
router.get("/admin/users", validateToken, roleCheck(["admin"]), userCtrl.getAllUsers);
router.post("/admin/estimate",validateToken,roleCheck(["admin"]), xroutemap.getEstimate);

export default router;


