import { Request, Response } from "express";
import * as communicationService from "../services/communicationService";

interface ApiResponse<T = any> {
  status: "success" | "error" | "warning";
  message: string;
  data: T;
}

// Get conversation by order ID
export const getConversation = async (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);

    if (isNaN(orderId)) {
      const errorResponse: ApiResponse = {
        status: "error",
        message: "Invalid order ID",
        data: {},
      };
      return res.status(400).json(errorResponse);
    }

    const conversation = await communicationService.getConversationByOrderId(orderId);

    const response: ApiResponse = {
      status: "success",
      message: `Retrieved conversation for order ${orderId}`,
      data: conversation,
    };

    res.json(response);
  } catch (err) {
    console.error("❌ Error fetching conversation:", err);
    console.error("📋 Error details:", {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      orderId: req.params.orderId,
      timestamp: new Date().toISOString()
    });

    const errorResponse: ApiResponse = {
      status: "error",
      message: err instanceof Error ? err.message : "Error fetching conversation. Please try again later.",
      data: {
        orderId: req.params.orderId,
        errorType: err instanceof Error ? err.constructor.name : 'Unknown'
      },
    };

    res.status(500).json(errorResponse);
  }
};

// Send message to customer
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { orderId, message, message_type, media_url, media_content_type } = req.body;

    // Validation
    if (!orderId || !message) {
      const errorResponse: ApiResponse = {
        status: "error",
        message: "Order ID and message are required",
        data: {},
      };
      return res.status(400).json(errorResponse);
    }

    // Get user info from token (set by validateToken middleware)
    const userId = (req as any).user?.id || 1;

    const result = await communicationService.sendMessageToCustomer({
      orderId: parseInt(orderId),
      message,
      message_type: message_type || "text",
      media_url,
      media_content_type,
      userId,
    });

    // Result format: { success: true, message: Message }
    const response: ApiResponse = {
      status: "success",
      message: "Message sent successfully",
      data: result.message,
    };
    res.json(response);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    console.error("📋 Error details:", {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const errorResponse: ApiResponse = {
      status: "error",
      message: err instanceof Error ? err.message : "Error sending message. Please try again later.",
      data: {},
    };

    res.status(500).json(errorResponse);
  }
};