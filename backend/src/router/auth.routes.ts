import { Router } from "express";
import * as authCtrl from "../controller/auth.controller";
import validateToken from "./validateToken";
import * as userCtrl from "../controller/user.controller";
import roleCheck from "../middlewares/roleCheck";
import * as driverCtrl from "../controller/driver.controller"; // Import the driver controller

const router = Router();

// Route to get user details - only accessible if the token is valid
router.get("/user", validateToken, userCtrl.getUserDetails);

// Route to sign up a new user - no role check needed, anyone can sign up
router.post("/signup", authCtrl.signup);

// Route to log in and get a JWT token - no role check needed, anyone can log in
router.post("/login", authCtrl.login);

// Route to fetch all users (admin-only access)
//router.get("/admin", validateToken, roleCheck(["admin"]), userCtrl.getAllUsers);
router.get("/admin", validateToken, roleCheck(["admin"]), (_req, res) => {
    // If authenticated and authorized, render the admin page
    res.render("admin"); 
});
// Route to get driver board, only accessible to drivers
router.get("/test/driver", validateToken, roleCheck(["driver"]), driverCtrl.getDriverBoard);



export default router;
