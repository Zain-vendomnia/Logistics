import fs from "fs";
import path from "path";
import { generatePODPdfFast } from "../utils/generatePdfFromHtml";
import { LogisticOrder } from "../model/LogisticOrders";
import { route_segments } from "../model/routeSegments";

const img = (base64?: string) =>
  base64
    ? `<img src="data:image/jpeg;base64,${base64}" style="max-width:400px;" />`
    : "Nicht verfügbar";

export const buildPODHtml = (data: any): string => {
  const templatePath = path.join(
    __dirname,
    "../assets/templates/podTemplate.html",
  );

  let html = fs.readFileSync(templatePath, "utf8");

  return html
    .replace("{{LOGO_URL}}", "https://yourcdn.com/sunniva.png")
    .replace("{{ORDER_NUMBER}}", data.orderDetails.order_number)
    .replace(
      "{{FULL_NAME}}",
      `${data.orderDetails.firstname} ${data.orderDetails.lastname}`,
    )
    .replace(
      "{{ADDRESS}}",
      `${data.orderDetails.street}, ${data.orderDetails.zipcode}, ${data.orderDetails.city}`,
    )
    .replace("{{DATE_TIME}}", data.formattedDateTime)
    .replace("{{DRIVER_NAME}}", data.driverName ?? "-")
    .replace("{{MAP_IMAGE}}", img(data.map))
    .replace("{{DRIVER_LOCATION_IMAGE}}", img(data.driverLocation))
    .replace("{{DOOR_STEP_IMAGE}}", img(data.doorStep))
    .replace("{{DELIVERED_IMAGE}}", img(data.deliveredItem))
    .replace("{{DELIVERED_MODAL_IMAGE}}", img(data.deliveredItemModal))
    .replace("{{SIGNATURE_IMAGE}}", img(data.signature));
};

export const generatePODPdfAsync = async (
  tourId: number,
  orderId: number,
): Promise<{ pdf: Buffer; title: string }> => {
  if (!tourId || !orderId) {
    throw new Error("tourId and orderNumber are required");
  }

  try {
    const order = await LogisticOrder.getOrdersByIds([orderId]);
    const orderDetails = order[0];
    if (!orderDetails) throw new Error("Order not found");

    // const segmentData = await route_segments.getRoutesegmentRes(tourId);
    const routeImages = await route_segments.getRoutesegmentImagesRes(
      tourId,
      orderId,
    );

    // const html = buildPODHtml({
    //   orderDetails,
    //   orderImages: routeImages,
    //   segmentData,
    //   formattedDateTime: new Date().toLocaleString("de-DE"),
    //   driverName: "Sudad Algburi",
    //   map: routeImages?.map,
    //   driverLocation: routeImages?.driverLocation,
    //   doorStep: routeImages?.doorStep,
    //   deliveredItem: routeImages?.deliveredItem,
    //   deliveredItemModal: routeImages?.deliveredItemModal,
    //   signature: routeImages?.signature,
    // });
    // const title = `POD - Order: ${orderDetails.order_number}`;
    // const pdfData = await generatePdfFromHTML(html, title);

    const pdfBuffer = await generatePODPdfFast({
      orderDetails,
      //   orderImages: routeImages,
    //   segmentData, // route segment data
      formattedDateTime: new Date().toLocaleString("de-DE"),
      driverName: "Sudad Algburi",
      map: routeImages?.mapImage,
      driverLocation: routeImages?.driverLocation,
      doorStep: routeImages?.doorStep,
      deliveredItem: routeImages?.deliveredItem,
      deliveredItemModal: routeImages?.deliveredItemModal,
      signature: routeImages?.signature,
    });

    return { pdf: pdfBuffer, title: "title" };
  } catch (error) {
    console.log("Error: ", error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
};

export const sendPODPdfAsync = async (tourId: number, orderId: number) => {
  const pdf = await generatePODPdfAsync(tourId, orderId);

  if (!pdf) return false;

  return true;
};
