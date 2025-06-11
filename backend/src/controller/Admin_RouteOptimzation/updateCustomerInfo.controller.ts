import { Request, Response } from "express";
import { updateCustomerInfoService } from "../../services/updateCustomerInfo.service";

export const updateCustomerInfoController = async (req: Request, res: Response) => {
  try {
    const updatedCustomer = await updateCustomerInfoService(req.body);
    res.status(200).json({ message: "Customer info updated successfully", updatedCustomer });
  } catch (error: any) {
    console.error("Error updating customer info:", error.message);
    res.status(500).json({ error: "Failed to update customer info" });
  }
};
