import { Request, Response } from "express";
import * as cancelService from "../../services/cancelService.service";

// ✅ API Response interface
interface ApiResponse<T = any> {
  status: "success" | "error" | "warning";
  message: string;
  data: T;
}

// ✅ Interface for cancel item
interface CancelItem {
  id: number;
  order_id?: number | null;
  order_number: string;
  slmdl_articleordernumber: string;
  quantity: number;
  cancelQuantity: number;
  warehouse_id?: string | null;
}

// ✅ Interface for request body
interface AddCancelDetailsRequest {
  orderNumber: string;
  items: CancelItem[];
}

// ✅ Read all
export const getAllCancels = async (_req: Request, res: Response) => {
  try {
    console.log("Fetching all cancels...");
    const data = await cancelService.getAllCancels();
    console.log("Fetched cancels:", data);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: "Error fetching cancels" });
  }
};

// ✅ Create new cancel (Updated with validation logic)
export const createCancel = async (req: Request, res: Response) => {
  try {
    const { orderNumber, items }: AddCancelDetailsRequest = req.body;

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
        message: "At least one cancel item is required.",
        data: {},
      };
      return res.status(200).json(response);
    }

    // ✅ Validate each item has required fields and cancel quantity
    for (const item of items) {
      if (!item.slmdl_articleordernumber) {
        const response: ApiResponse = {
          status: "error",
          message: "Invalid item data. Each item must have article number.",
          data: {},
        };
        return res.status(200).json(response);
      }

      // ✅ Validate cancel quantity > 0
      if (item.cancelQuantity <= 0) {
        const response: ApiResponse = {
          status: "error",
          message: "Cancel quantity must be greater than 0.",
          data: {},
        };
        return res.status(200).json(response);
      }

      // ✅ Validate cancel quantity <= original quantity
      if (item.cancelQuantity > item.quantity) {
        const response: ApiResponse = {
          status: "error",
          message: `Cancel quantity cannot exceed original quantity (${item.quantity}) for item ${item.slmdl_articleordernumber}.`,
          data: {},
        };
        return res.status(200).json(response);
      }
    }

    // ✅ Call service to insert cancel details
    const result = await cancelService.createCancel(orderNumber, items);

    // ✅ Check if insertion was successful
    if (!result.success) {
      const response: ApiResponse = {
        status: "error",
        message: result.message || "Failed to add cancel details.",
        data: {},
      };
      return res.status(200).json(response);
    }

    // ✅ Success response
    const response: ApiResponse = {
      status: "success",
      message: `Successfully created cancel for order ${orderNumber} with ${items.length} item(s).`,
      data: {
        orderNumber,
        cancelId: result.cancelId,
        itemsAdded: items.length,
        insertedItemIds: result.insertedItemIds,
      },
    };

    return res.status(200).json(response);
  } catch (error: any) {
    console.error("Error in createCancel controller:", error);

    const response: ApiResponse = {
      status: "error",
      message: error.message || "Internal server error occurred.",
      data: {},
    };

    return res.status(200).json(response);
  }
};

// ✅ Update cancel
export const updateCancel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cancel_quantity } = req.body;

    // ✅ Validate cancel quantity > 0
    if (cancel_quantity !== undefined && cancel_quantity <= 0) {
      const response: ApiResponse = {
        status: "error",
        message: "Cancel quantity must be greater than 0.",
        data: {},
      };
      return res.status(200).json(response);
    }

    const data = await cancelService.updateCancel(Number(id), { cancel_quantity });
    
    const response: ApiResponse = {
      status: "success",
      message: "Cancel updated successfully.",
      data: data,
    };
    
    res.json(response);
  } catch (error: any) {
    console.error("Error in updateCancel controller:", error);
    
    const response: ApiResponse = {
      status: "error",
      message: error.message || "Error updating cancel",
      data: {},
    };
    
    res.status(500).json(response);
  }
};

// ✅ Delete one
export const deleteCancel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await cancelService.deleteCancel(Number(id));
    
    const response: ApiResponse = {
      status: "success",
      message: "Cancel deleted successfully",
      data: {},
    };
    
    res.json(response);
  } catch (error: any) {
    console.error("Error in deleteCancel controller:", error);
    
    const response: ApiResponse = {
      status: "error",
      message: error.message || "Error deleting cancel",
      data: {},
    };
    
    res.status(500).json(response);
  }
};

// ✅ Delete all
export const deleteAllCancels = async (_req: Request, res: Response) => {
  try {
    await cancelService.deleteAllCancels();
    
    const response: ApiResponse = {
      status: "success",
      message: "All cancels deleted successfully",
      data: {},
    };
    
    res.json(response);
  } catch (error: any) {
    console.error("Error in deleteAllCancels controller:", error);
    
    const response: ApiResponse = {
      status: "error",
      message: error.message || "Error deleting all cancels",
      data: {},
    };
    
    res.status(500).json(response);
  }
};