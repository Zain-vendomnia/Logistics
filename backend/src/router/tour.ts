import { Router } from "express";
import { parseExcelToJobs } from "../utils/parseExcel";
import { create_dynamicTour } from "../controller/dynamic/dynamicTour.controller";
import { uploadMemory } from "../middlewares/upload";

const router = Router();

router.post("/upload-jobs", uploadMemory.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required." });
    }

    const jobList = parseExcelToJobs(req.file.path);

    // Pass jobList to the controller
    await create_dynamicTour(req, res, jobList);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to process uploaded Excel.",
      error: (err as Error).message,
    });
  }
});

export default router;
