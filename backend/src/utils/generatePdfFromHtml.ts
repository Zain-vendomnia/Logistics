import fs from "fs";
import path from "path";
// import { chromium } from "playwright";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// export const generatePdfFromHTML = async (
//   html: string,
//   title?: string,
// ): Promise<Buffer> => {
//   const browser = await chromium.launch();
//   const page = await browser.newPage();

//   await page.setContent(html, { waitUntil: "networkidle" });

//   if (title) {
//     await page.evaluate((t) => {
//       document.title = t;
//     }, title);
//   }

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//     // margin: {
//     //   top: "10mm",
//     //   bottom: "10mm",
//     //   left: "10mm",
//     //   right: "10mm",
//     // },
//   });

//   await browser.close();
//   return pdfBuffer;
// };

const loadTestImage = (filename: string): string | null => {
  try {
    const filePath = path.join(__dirname, "../assets/testImages", filename);
    const buffer = fs.readFileSync(filePath);
    return buffer.toString("base64");
  } catch (e) {
    console.warn("Image not found:", filename);
    return null;
  }
};

// Helper to embed base64 image
const embedImage = async (pdfDoc: PDFDocument, base64?: string) => {
  if (!base64) return null;
  try {
    const cleanedBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
    const bytes = Buffer.from(cleanedBase64, "base64");

    if (bytes[0] === 0x89 && bytes[1] === 0x50) {
      return await pdfDoc.embedPng(bytes);
    }

    return await pdfDoc.embedJpg(bytes);
  } catch (e) {
    console.warn("Failed to embed image", e);
    return null;
  }
};

export const generatePODPdfFast = async (podData: {
  orderDetails: any;
  formattedDateTime: string;
  driverName: string;
  map?: string;
  driverLocation?: string;
  doorStep?: string;
  deliveredItem?: string;
  deliveredItemModal?: string;
  signature?: string;
}): Promise<Buffer> => {
  const pdfDoc = await PDFDocument.create();

  pdfDoc.setTitle(`POD - Order ${podData.orderDetails.order_number}`);

  const page = pdfDoc.addPage([595, 842]); // A4: 595x842 pt
  const { height } = page.getSize();
  const margin = 40;
  let y = height - margin;

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, options: any = {}) => {
    const {
      size = 12,
      color = rgb(0, 0, 0),
      font: f = font,
      lineHeight = 14,
    } = options;
    page.drawText(text, { x: margin, y, size, font: f, color });
    y -= lineHeight;
  };
  const drawLabeledImage = async (
    label: string,
    base64?: string,
    width = 200,
    height = 120,
  ) => {
    if (!base64) return; // Skip if no image

    // Draw the label
    drawText(`${label}:`, { font: fontBold, size: 12, lineHeight: 16 });

    // Embed and draw image
    const img = await embedImage(pdfDoc, base64);
    if (!img) {
      drawText("Nicht verfügbar", { size: 10, color: rgb(0.5, 0.5, 0.5) });
      y -= 10;
      return;
    }

    page.drawImage(img, {
      x: margin + 50,
      y: y - height, // top-left corner
      width,
      height,
    });

    y -= height + 24; // leave space after image for next content
  };

  // Header
  drawText("Nachweis", { size: 20, font: fontBold });
  drawText("SUNNIVA GmbH", { font: fontBold });
  drawText("Honer Straße 49");
  drawText("37269 Eschwege");
  y -= 10;

  drawText(`Order: ${podData.orderDetails.order_number}`, { font: fontBold });
  drawText(
    `Name: ${podData.orderDetails.firstname} ${podData.orderDetails.lastname}`,
  );
  drawText(
    `Adresse: ${podData.orderDetails.street}, ${podData.orderDetails.zipcode}, ${podData.orderDetails.city}`,
  );
  drawText(`Datum: ${podData.formattedDateTime}`);
  drawText(`Mitarbeiter: ${podData.driverName}`);
  y -= 10;

  if (!podData.map) podData.map = loadTestImage("map.png")!;
  if (!podData.signature) podData.signature = loadTestImage("signature.png")!;
  if (!podData.deliveredItem)
    podData.deliveredItem = loadTestImage("deliveredItem.png")!;

  // Images
  await drawLabeledImage("Karte", podData.map);
  await drawLabeledImage("Mitarbeiterstandort", podData.driverLocation);
  await drawLabeledImage("Door Step", podData.doorStep);
  await drawLabeledImage("Delivered", podData.deliveredItem);
  await drawLabeledImage("Delivered Modal", podData.deliveredItemModal);
  await drawLabeledImage("Signature", podData.signature);

  // Footer / Note
  drawText(
    "Dieser Nachweis wurde maschinell erstellt und ist ohne Unterschrift gültig.",
    { size: 10, color: rgb(0.4, 0.4, 0.4) },
  );

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
