import { Request, Response } from "express";
import * as customerService from "../../services/customerService";

export const getAllCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json(customers);
  } catch (err) {
    console.error("Error fetching customers:", err);
    res.status(500).json({ message: "Error fetching customers" });
  }
};
