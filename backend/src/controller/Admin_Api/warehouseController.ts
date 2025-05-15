import { Request, Response } from "express";
import * as warehouseService from "../../services/warehouseService";

export const getAllWarehouses = async (_req: Request, res: Response) => {
  try {
    const warehouses = await warehouseService.getAllWarehouses();
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ message: "Error fetching warehouses" });
  }
};

export const getWarehouseById = async (req: Request, res: Response) => {
  try {
    const warehouse = await warehouseService.getWarehouseById(Number(req.params.id));
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ message: "Error fetching warehouse" });
  }
};

export const createWarehouse = async (req: Request, res: Response) => {
  try {
    const newWarehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json(newWarehouse);
  } catch (err) {
    res.status(500).json({ message: "Error creating warehouse" });
  }
};

export const updateWarehouse = async (req: Request, res: Response) => {
  try {
    const updated = await warehouseService.updateWarehouse(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Warehouse not found" });
    res.json({ message: "Warehouse updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating warehouse" });
  }
};

export const deleteWarehouse = async (req: Request, res: Response) => {
  try {
    const deleted = await warehouseService.deleteWarehouse(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Warehouse not found" });
    res.json({ message: "Warehouse deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting warehouse" });
  }
};

export const deleteMultipleWarehouses = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const count = await warehouseService.deleteMultipleWarehouses(ids);
    res.json({ message: `${count} warehouses deleted` });
  } catch (err) {
    res.status(500).json({ message: "Error deleting warehouses" });
  }
};
