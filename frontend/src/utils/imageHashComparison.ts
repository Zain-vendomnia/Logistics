// import Tesseract, { ImageLike, PSM } from "tesseract.js";
// import { createWorker } from "tesseract.js";
// import stringSimilarity from "string-similarity";
// import blockhash from "blockhash-core";

// export async function getImageHash(base64: string): Promise<string> {
//   const img = new Image();
//   img.src = base64.startsWith("data:image")
//     ? base64
//     : `data:image/png;base64,${base64}`;

//   await new Promise<void>((resolve, reject) => {
//     img.onload = () => resolve();
//     img.onerror = (err) => {
//       console.error("Image failed to load:", err, img.src.slice(0, 100));
//       reject(new Error("Image load error"));
//     };
//   });

//   const canvas = document.createElement("canvas");
//   const ctx = canvas.getContext("2d")!;
//   canvas.width = img.width;
//   canvas.height = img.height;
//   ctx.drawImage(img, 0, 0);

//   const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// //   const hash = blockhash.bmvbhash(imageData, 16);
//   return hash;
// }

export function hammingDistance(hash1: string, hash2: string): number {
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

// export const readImageDataText = async (imageData: string): Promise<string> => {
//   try {
//     const result = await Tesseract.recognize(imageData, "eng");
//     // {      logger: (m) => console.log(m),}
//     const text = result.data.text;
//     // console.log("Extracted Image Data: ", result);
//     // console.log("Extracted Text: ", text);
//     return text.trim().toUpperCase();
//   } catch (error) {
//     console.error("Error reading image data:", error);
//     throw new Error(`Failed to read image data text: ${error}`);
//   }
// };

// export const recognizeTextFromImage = async (image: ImageLike) => {
//   const worker = await createWorker();
//   await worker.reinitialize("eng");

//   const {
//     data: { text },
//   } = await worker.recognize(image);

//   await worker.terminate();
//   return text.trim().toUpperCase();
// };

// export const imageWorkerOCR = async (
//   canvas: HTMLCanvasElement
// ): Promise<string> => {
//   const worker = await createWorker();
//   await worker.reinitialize("eng");

//   await worker.setParameters({
//     tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-",
//     // tessedit_pageseg_mode: PSM.SINGLE_WORD,
//     tessedit_pageseg_mode: PSM.SPARSE_TEXT,
//     // tessedit_char_whitelist: "SLMD0123456789P", // Only characters expected
//     // tessedit_char_whitelist: undefined,
//   });

//   const { data } = await worker.recognize(canvas);

//   console.log("OCR Output:", data);
//   // console.log("OCR Output:", data.text);

//   await worker.terminate();
//   return data.text.trim().toUpperCase();
// };

export function preprocessImage(
  img: HTMLImageElement | HTMLCanvasElement
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = img.width;
  canvas.height = img.height;

  // ctx.filter = "contrast(150%) brightness(120%)";
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const avg =
      (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
    imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = avg;
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function thresholdFilter(data: any, threshold: number) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const avg = (r + g + b) / 3;
    const value = avg >= threshold * 255 ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }

  return data;
}
function grayscaleFilter(data: any, imgData: ImageData) {
  for (let i = 0; i < data.length; i += 4) {
    const avg =
      (imgData.data[i] + imgData.data[i + 1] + imgData.data[i + 2]) / 3;
    imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = avg;
  }

  return imgData;
}

// export const isFuzzyMatch = (ocrText: string, expected: string): boolean => {
//   // Clean up and split OCR text into words
//   const words = ocrText
//     .replace(/[^a-zA-Z0-9]/g, " ") // remove special chars
//     .toUpperCase()
//     .split(/\s+/);

//   // Compare each word with the expected label
//   for (const word of words) {
//     const score = stringSimilarity.compareTwoStrings(word, expected);
//     if (score >= 0.85) {
//       return true; // Match found with 85% or more similarity
//     }
//   }

//   return false;
// };

// export const findLikelyParcelCode = (
//   ocrText: string,
//   prefixSet = ["S", "SL", "SLM", "SLMD", "SLMDL"],
//   minSimilarity = 0.85
// ): string | null => {
//   const words = ocrText
//     .replace(/[^A-Z0-9]/gi, " ") // clean out non-alphanumerics
//     .toUpperCase()
//     .split(/\s+/);

//   for (const word of words) {
//     for (const prefix of prefixSet) {
//       if (
//         word.startsWith(prefix) &&
//         stringSimilarity.compareTwoStrings(
//           word.substring(0, prefix.length),
//           prefix
//         ) >= minSimilarity
//       ) {
//         return word.substring(0, 5); // return the first 5 characters
//       }
//     }
//   }

//   return null;
// };
