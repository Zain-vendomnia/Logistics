// import express from "express";
// import multer from "multer";
// import path from "path";
// // import validateToken from "../middlewares/validateToken";
// // import roleCheck from "../middlewares/roleCheck";
// import {
//   updateUnreadCount,
//   getMessagesByOrderId,
//   sendMessage,
//   uploadFile, // New upload controller
//   // Webhook controllers
//   handleTwilioStatusWebhook,
//   handleTwilioIncomingWebhook,
//   testWebhookEndpoint
// } from "../controller/Admin_Api/messagesController";
// import { notFoundHandler } from "../middlewares/notFoundHandler";

// const router = express.Router();

// // Fixed multer setup with proper filename generation
// const storage = multer.diskStorage({
//   destination: (_req,_file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (_req, file, cb) => {
//     const timestamp = Date.now();
//     const random = Math.random().toString(36).substring(7);
//     const ext = path.extname(file.originalname);
//     const name = path.basename(file.originalname, ext)
//       .replace(/[^a-zA-Z0-9]/g, '-')
//       .substring(0, 30);
    
//     const filename = `${timestamp}-${random}-${name}${ext}`;
//     cb(null, filename);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: { fileSize: 16 * 1024 * 1024 } // 16MB limit
// });

// // Serve uploaded files
// router.use('/files', express.static('uploads'));

// // WEBHOOK ROUTES (NO AUTH)
// router.use('/twilio', express.urlencoded({ extended: true }));
// router.use('/twilio', express.json());

// router.post("/twilio/status", handleTwilioStatusWebhook);
// router.post("/twilio/incoming", handleTwilioIncomingWebhook);
// router.get("/twilio/test", testWebhookEndpoint);

// // AUTHENTICATED ROUTES
// // router.use(validateToken);
// // router.use(roleCheck(["admin"]));

// router.use('/whatsapp-media', express.static('uploads/whatsapp-media'));
// // FILE UPLOAD ROUTE
// router.post("/upload", upload.single('file'), uploadFile);

// // MESSAGE ROUTES
// router.get("/:orderId", getMessagesByOrderId);
// router.post("/:orderId", sendMessage);
// router.put("/:orderId/unread-count", updateUnreadCount);

// router.use(notFoundHandler);

// export default router;