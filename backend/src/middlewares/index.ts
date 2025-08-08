import cors from "cors";
import morgan from "morgan";
import express from "express";

export const registerMiddlewares = (app: express.Application) => {
  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
};
