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
  damageQuantity: number;
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

    // ✅ Validate each item
    for (const item of items) {
      if (!item.slmdl_articleordernumber) {
        const response: ApiResponse = {
          status: "error",
          message: "Article order number is required for all items.",
          data: {},
        };
        return res.status(200).json(response);
      }

      if (item.returnQuantity < 0 || item.damageQuantity < 0) {
        const response: ApiResponse = {
          status: "error",
          message: "Return and damage quantities cannot be negative.",
          data: {},
        };
        return res.status(200).json(response);
      }

      if (item.returnQuantity + item.damageQuantity > item.quantity) {
        const response: ApiResponse = {
          status: "error",
          message: `Return + Damage quantity cannot exceed original quantity for article ${item.slmdl_articleordernumber}.`,
          data: {},
        };
        return res.status(200).json(response);
      }

      if (item.returnQuantity === 0 && item.damageQuantity === 0) {
        const response: ApiResponse = {
          status: "error",
          message: "At least one item must have return or damage quantity greater than 0.",
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
      message: `Successfully added ${items.length} return item(s) for order ${orderNumber}.`,
      data: {
        orderNumber,
        itemsAdded: items.length,
        insertedIds: result.insertedIds,
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