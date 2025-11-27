import { Request, Response } from "express";
import * as customerService from "../../services/customerService";
import { ApiResponse } from "../../types/apiResponse.type";

// Get all customers controller
export const getAllCustomers = async (_req: Request, res: Response) => {
  try {
    const customers = await customerService.getAllCustomers();
    
    const response: ApiResponse = {
      status: "success",
      message: `Retrieved ${customers.length} customers successfully`,
      data: customers
    };
    
    res.json(response);
  } catch (err) {
    console.error("Error fetching customers:", err);
    
    const errorResponse: ApiResponse = {
      status: "error",
      message: "Error fetching customers. Please try again later.",
      data: {}
    };
    
    res.status(500).json(errorResponse);
  }
};