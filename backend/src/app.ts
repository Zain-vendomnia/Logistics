import express from "express";
import cors from 'cors';
import morgan from "morgan";
import authRouter from "./router/auth.routes";
import adminRouter from "./router/admin.routes";
// import userRouter from "./router/auth.routes";
import config from "./config";
import { setupSwagger } from './swagger';

const app = express();
app.use(cors());

app.set("port", config.PORT);
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.use(express.json({ limit: '50mb' })); // Increase limit if sending large images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Swagger setup
setupSwagger(app);

// Define the root route to prevent "Cannot GET /"
app.get('/', (_req, res) => {
  res.send("Welcome to the API!"); 
});

// Router
app.use("/api/auth", authRouter);
app.use("/api", authRouter);  
app.use("/api/test", authRouter);
  

app.use("/api/admin", adminRouter);


// Catch-all 404 Handler (keep this LAST)
app.use((req, res) => {
  res.status(404).json({
    message: `Oops! Route [${req.method}] ${req.originalUrl} not found on this server.`,
    suggestion: "Check your URL or method type (GET, POST, etc.)"
  });
});



export default app;
