import { Request, Response } from "express";
import * as returnService from "../../services/returnService.service";

// ✅ API Response interface
interface ApiResponse<T = any> {
  status: "success" | "error" | "warning";
  message: string;
  data: T;
}

// ✅ Interface for return item
interface ReturnItem {
  id: number;
  order_id?: number | null;
  order_number: string;
  slmdl_articleordernumber: string;
  quantity: number;
  returnQuantity: number;
  warehouse_id?: string | null;
}

// ✅ Interface for request body
interface AddReturnDetailsRequest {
  orderNumber: string;
  items: ReturnItem[];
}

// ✅ Read all
export const getAllReturns = async (_req: Request, res: Response) => {
  try {
    const data = await returnService.getAllReturns();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching returns" });
  }
};

// ✅ Create new return (Updated with validation logic)
export const createReturn = async (req: Request, res: Response) => {
  try {
    const { orderNumber, items }: AddReturnDetailsRequest = req.body;

    // ✅ Validate input - orderNumber
    if (!orderNumber || orderNumber.trim() === "") {
      const response: ApiResponse = {
        status: "error",
        message: "Order number is required.",
        data: {},
      };
      return res.status(200).json(response);
    }

    // ✅ Validate input - items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      const response: ApiResponse = {
        status: "error",
        message: "At least one return item is required.",
        data: {},
      };
      return res.status(200).json(response);
    }

    // ✅ Validate each item has required fields and return quantity
    for (const item of items) {
      if (!item.slmdl_articleordernumber) {
        const response: ApiResponse = {
          status: "error",
          message: "Invalid item data. Each item must have article number.",
          data: {},
        };
        return res.status(200).json(response);
      }

      // ✅ Validate return quantity > 0
      if (item.returnQuantity <= 0) {
        const response: ApiResponse = {
          status: "error",
          message: "Return quantity must be greater than 0.",
          data: {},
        };
        return res.status(200).json(response);
      }

      // ✅ Validate return quantity <= original quantity
      if (item.returnQuantity > item.quantity) {
        const response: ApiResponse = {
          status: "error",
          message: `Return quantity cannot exceed original quantity (${item.quantity}) for item ${item.slmdl_articleordernumber}.`,
          data: {},
        };
        return res.status(200).json(response);
      }
    }

    // ✅ Call service to insert return details
    const result = await returnService.createReturn(orderNumber, items);

    // ✅ Check if insertion was successful
    if (!result.success) {
      const response: ApiResponse = {
        status: "error",
        message: result.message || "Failed to add return details.",
        data: {},
      };
      return res.status(200).json(response);
    }

    // ✅ Success response
    const response: ApiResponse = {
      status: "success",
      message: `Successfully created return for order ${orderNumber} with ${items.length} item(s).`,
      data: {
        orderNumber,
        returnId: result.returnId,
        itemsAdded: items.length,
        insertedItemIds: result.insertedItemIds,
      },
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error in createReturn controller:", error);

    const response: ApiResponse = {
      status: "error",
      message: error.message || "Internal server error occurred.",
      data: {},
    };

    return res.status(200).json(response);
  }
};

// ✅ Update return
export const updateReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { return_quantity } = req.body;

    // ✅ Validate return quantity > 0
    if (return_quantity !== undefined && return_quantity <= 0) {
      const response: ApiResponse = {
        status: "error",
        message: "Return quantity must be greater than 0.",
        data: {},
      };
      return res.status(200).json(response);
    }

    const data = await returnService.updateReturn(Number(id), { return_quantity });
    
    const response: ApiResponse = {
      status: "success",
      message: "Return updated successfully.",
      data: data,
    };
    
    res.json(response);
  } catch (error: any) {
    console.error("Error in updateReturn controller:", error);
    
    const response: ApiResponse = {
      status: "error",
      message: error.message || "Error updating return",
      data: {},
    };
    
    res.status(500).json(response);
  }
};

// ✅ Delete one
export const deleteReturn = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await returnService.deleteReturn(Number(id));
    
    const response: ApiResponse = {
      status: "success",
      message: "Return deleted successfully",
      data: {},
    };
    
    res.json(response);
  } catch (error: any) {
    console.error("Error in deleteReturn controller:", error);
    
    const response: ApiResponse = {
      status: "error",
      message: error.message || "Error deleting return",
      data: {},
    };
    
    res.status(500).json(response);
  }
};

// ✅ Delete all
export const deleteAllReturns = async (_req: Request, res: Response) => {
  try {
    await returnService.deleteAllReturns();
    
    const response: ApiResponse = {
      status: "success",
      message: "All returns deleted successfully",
      data: {},
    };
    
    res.json(response);
  } catch (error: any) {
    console.error("Error in deleteAllReturns controller:", error);
    
    const response: ApiResponse = {
      status: "error",
      message: error.message || "Error deleting all returns",
      data: {},
    };
    
    res.status(500).json(response);
  }
};