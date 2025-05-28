import { Request, Response } from "express";
import { getFilteredToursService } from "../services/tourManagement.service";

export const getFilteredToursController = async (req: Request, res: Response) => {
  try {
    const { status = "pending", search = "", page = "1", limit = "10" } = req.query;

    const result = await getFilteredToursService({
      status: status.toString(),
      search: search.toString(),
      page: parseInt(page.toString(), 10),
      limit: parseInt(limit.toString(), 10),
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching filtered tours:", error);
    res.status(500).json({ message: "Server error" });
  }
};
