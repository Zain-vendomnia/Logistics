import express from "express";
import config from "./config/config";
import { setupSwagger } from "./config/swagger";

import apiRoutes from "./router";
import { registerMiddlewares } from "./middlewares";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";

const app = express();

const PORT = config.PORT || 3001;
app.set("port", PORT);

//global middlewares
registerMiddlewares(app);

// Swagger setup
setupSwagger(app);

// Health check / root
app.get("/", (_req, res) => {
  res.send("Welcome to the API!");
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
