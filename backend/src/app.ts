import express from "express";
import cors from 'cors';
import morgan from "morgan";
import authRouter from "./router/auth.routes";
import userRouter from "./router/auth.routes";
import config from "./config";


const app = express();
app.use(cors());

app.set("port", config.PORT);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// Define the root route to prevent "Cannot GET /"
app.get('/', (_req, res) => {
  res.send("Welcome to the API!"); // or any other message you prefer
});

// Router
app.use("/api/auth", authRouter);
app.use("/api", userRouter);  
app.use("/api/test", userRouter);  

export default app;
