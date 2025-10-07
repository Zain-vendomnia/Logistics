import multer from "multer";
import path from "path";

// ---------- Disk storage (files saved to uploads/) ----------
const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/");
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const uploadDisk = multer({
  storage: diskStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // optional limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only Excel/CSV files allowed"));
  },
});

// ---------- Memory storage (files stay in RAM) ----------
const memoryStorage = multer.memoryStorage();

export const uploadMemory = multer({
  storage: memoryStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only Excel/CSV files allowed"));
  },
});
