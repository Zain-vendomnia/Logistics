import { Request, Response } from "express";
import * as returnService from "../../services/returnService.service";

// ✅ Read all
export const getAllReturns = async (_req: Request, res: Response) => {
  try {
    const data = await returnService.getAllReturns();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching returns" });
  }
};

// ✅ Create new return
export const createReturn = async (req: Request, res: Response) => {
  try {
    const { order_id, customer_id, items } = req.body;

    if (!order_id || !customer_id || !items) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const result = await returnService.createReturn(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error creating return" });
  }
};

// ✅ Update return
export const updateReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = await returnService.updateReturn(Number(id), req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error updating return" });
  }
};

// ✅ Delete one
export const deleteReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await returnService.deleteReturn(Number(id));
    res.json({ message: "Return deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting return" });
  }
};

// ✅ Delete all
export const deleteAllReturns = async (_req: Request, res: Response) => {
  try {
    await returnService.deleteAllReturns();
    res.json({ message: "All returns deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting all returns" });
  }
};
