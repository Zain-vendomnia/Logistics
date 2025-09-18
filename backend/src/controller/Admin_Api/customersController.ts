import { Request, Response } from "express";
import * as customerService from "../../services/customerService";

// API Response interface
interface ApiResponse<T = any> {
  status: 'success' | 'error' | 'warning';
  message: string;
  data: T;
}

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

// Search validation function
const validateSearchTerm = (term: any): string | null => {
  if (typeof term !== 'string' || !term.trim()) {
    return "Search term must be a non-empty string.";
  }
  
  const length = term.trim().length;
  if (length < 2) {
    return "Search term must be at least 2 characters long.";
  }
  
  if (length > 100) {
    return "Search term cannot exceed 100 characters.";
  }
  
  return null;
};

// Search customers controller
export const searchCustomers = async (req: Request, res: Response) => {
  try {
    // Extract search term from different possible sources
    const searchTerm = 
      (req.method === 'POST' && req.body?.searchTerm) ||
      (req.query?.searchTerm as string) ||
      (req.params?.searchTerm);

    // Validate search term
    const validationError = validateSearchTerm(searchTerm);
    if (validationError) {
      const errorResponse: ApiResponse = {
        status: "error",
        message: validationError,
        data: {}
      };
      return res.status(400).json(errorResponse);
    }

    // Sanitize and search
    const sanitizedSearchTerm = (searchTerm as string).trim();
    console.log(`Searching for customers with term: "${sanitizedSearchTerm}"`);
    
    const customers = await customerService.searchCustomers(sanitizedSearchTerm);
    
    // Prepare response based on results
    let response: ApiResponse;
    
    if (customers.length === 0) {
      response = {
        status: "success",
        message: `No customers found matching "${sanitizedSearchTerm}"`,
        data: []
      };
    } else {
      response = {
        status: "success",
        message: `Found ${customers.length} customer(s) matching "${sanitizedSearchTerm}"`,
        data: customers
      };
    }
    
    return res.json(response);
    
  } catch (err) {
    console.error("Error in searchCustomers:", err);
    
    const errorResponse: ApiResponse = {
      status: "error",
      message: "Internal server error occurred while searching customers. Please try again later.",
      data: {}
    };
    
    res.status(500).json(errorResponse);
  }
};