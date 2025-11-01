import { Request, Response } from "express";
import { insertReturnDetails } from "../../services/returnDetails.service";

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

/**
 * POST /admin/addReturnDetails
 * @description Add return details for order items
 */
export const addReturnDetails = async (req: Request, res: Response) => {
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

    // ✅ Validate each item has required fields
    for (const item of items) {
      if (!item.slmdl_articleordernumber || item.returnQuantity <= 0) {
        const response: ApiResponse = {
          status: "error",
          message: "Invalid item data. Each item must have article number and valid return quantity.",
          data: {},
        };
        return res.status(200).json(response);
      }
    }

    // ✅ Call service to insert return details
    const result = await insertReturnDetails(orderNumber, items);

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
    console.error("Error in addReturnDetails controller:", error);

    const response: ApiResponse = {
      status: "error",
      message: error.message || "Internal server error occurred.",
      data: {},
    };

    return res.status(200).json(response);
  }
};