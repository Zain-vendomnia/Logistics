import { Request, Response } from "express";
import * as warehouseService from "../../services/warehouse.service";

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
    const warehouseId = Number(req.params.id);
    if (!warehouseId)
      return res.status(404).json({ message: "Invalid Warehouse" });

    const warehouse = await warehouseService.getWarehouseById(warehouseId);

    if (!warehouse) {
      return res.status(400).json({ message: "Warehouse not found" });
    }

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
      console.log("===== Update Warehouse Request =====");
      console.log("Body:", req.body);
      console.log("===================================");
    const updated = await warehouseService.updateWarehouse(
      Number(req.params.id),
      req.body
    );
    if (!updated)
      return res.status(404).json({ message: "Warehouse not found" });
    res.json({ message: "Warehouse updated" });
  } catch (err) {
    res.status(500).json({ message: "Error updating warehouse" });
  }
};

// Disable single warehouse
export const disableWarehouse = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const result = await warehouseService.disableWarehouse(id);

    // Always return 200, frontend can use `status` for logic
    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({
      status: "error",
      message: "Error disabling warehouse",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// Disable multiple warehouses
export const disableMultipleWarehouses = async (
  req: Request,
  res: Response
) => {
  try {
    const { ids } = req.body;
    const validIds = Array.isArray(ids)
      ? ids.filter((id) => Number.isInteger(Number(id)) && Number(id) > 0)
      : [];

    if (validIds.length === 0) {
      return res.status(200).json({
        status: "error",
        message: "No valid warehouse IDs provided",
      });
    }

    const result = await warehouseService.disableMultipleWarehouses(validIds);

    return res.status(200).json(result);
  } catch (err) {
    return res.status(200).json({
      status: "error",
      message: "Error disabling warehouses",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
