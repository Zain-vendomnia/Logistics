import adminApiService from "../services/adminApiService";
import latestOrderServices from "../components/Admin/AdminServices/latestOrderServices";
// import { showSnackbar } from './utils';  // Assuming you have a showSnackbar utility function
import { getOrderInitialEmailHTML } from "../assets/templates/OrderInitialEmails";

// For PDF
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { PODEmailHtml } from "../assets/templates/PODEmailTemplate";

// Function to handle sending parking permit emails
export const handlePermit = async (permitTourIds: string[]) => {
  const instance = latestOrderServices.getInstance();
  const toursdata = await instance.getTours();
  const idNumbers = permitTourIds.map((id) => Number(id)); // Get the IDs of selected tours
  const matchedTours = toursdata.filter((tour: any) =>
    idNumbers.includes(tour.id),
  );

  // Filter the tours based on the selected IDs
  const allOrders = matchedTours.flatMap((tour: any) => tour.orders); // Extract all orders from matched tours

  try {
    // Send an email to each order's customer
    for (const order of allOrders) {
      const orderNumber = order.order_number;

      // Generate the URL for the parking permit form
      const baseUrl = `${window.location.protocol}//${window.location.host}/ParkingPermitForm`;
      const encodedOrderNumber = btoa(orderNumber); // Base64 encode the order number
      const finalUrl = `${baseUrl}?o=${encodedOrderNumber}`;

      const trackingCode = order.tracking_code;
      let html = "";
      let condition = 0;
      let triggerMail = false;
      let subject = "";

      // Format the order delivery time
      const formattedTime = formatDeliveryWindow(order.expected_delivery_time);
      order.order_time = formattedTime;

      const metaData =
        await adminApiService.getOrderNotificationMetaData(orderNumber);

      // ✅ Correctly access the array inside the API response
      const metaArray = metaData.data.data;

      // ✅ Safeguard: Check if it's an array before using `.some`
      if (Array.isArray(metaArray)) {
        const isCase1 = metaArray.some(
          (meta: { meta_key: string; meta_value: string }) =>
            meta.meta_key === "customer_initial_email_case" &&
            meta.meta_value === "case_1",
        );
        console.log(
          " <================ LINE = 55 : FILE = handleHelper.ts ==============>",
          orderNumber,
          trackingCode,
        );
        if (isCase1 && trackingCode && order.order_status_id !== 10006) {
          condition = 3;
          subject = `Hurra! Ihre Bestellung - ${order.tracking_code} (${orderNumber}) wurde vollständig versandt!🚚`;
          triggerMail = true;
        }
      } else {
        condition = 2;
        subject = `Gute Neuigkeiten 🎉 Ihre Bestellung - ${order.tracking_code} (${orderNumber}) ist unterwegs!`;
        triggerMail = true;
      }

      if (triggerMail === true) {
        // Generate the email HTML content
        html = getOrderInitialEmailHTML(order, finalUrl, condition);

        if (html !== "") {
          // Send the email
          let sent = await adminApiService.sendEmail({
            to: "muhammad.jahanzaibbaloch@vendomnia.com", // Replace with actual email
            subject: subject,
            html,
          });

          let notif = await adminApiService.updateOrderNotificationMetaData(
            orderNumber,
            "customer_initial_email_case",
            condition === 3 ? "case_3" : "case_2",
          );

          console.log(
            " <================ LINE = 87 : FILE = handleHelper.ts ==============>",
            orderNumber,
            "Trigger mail",
          );
        }
      }
    }
  } catch (error) {
    console.error("Error sending emails:", error);
  }
};

// Helper function to format the delivery window (just an example)
export const formatDeliveryWindow = (isoString: string): string => {
  const startDate = new Date(isoString);
  const endDate = new Date(startDate.getTime() + 180 * 60000); // Add 30 minutes

  // Format date
  const day = String(startDate.getUTCDate()).padStart(2, "0");
  const month = String(startDate.getUTCMonth() + 1).padStart(2, "0");
  const year = startDate.getUTCFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  // Format time helper
  const formatTime = (date: Date): string => {
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const startTime = formatTime(startDate);
  const endTime = formatTime(endDate);

  return `${formattedDate} (${startTime}) zwischen ${endTime}`;
};

// Helper to convert Blob to base64 For PDF
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Generate PDF From Element method
export const generatePdfFromElement = async (
  element: HTMLElement,
  config: any,
): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // ⬅️ Lower resolution
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.8); // ⬅️ JPEG instead of PNG
      const pdf = new jsPDF(config);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ratio = canvas.height / canvas.width;
      const pdfWidth = pageWidth;
      const pdfHeight = pdfWidth * ratio;

      let position = 0;

      if (pdfHeight < pageHeight) {
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      } else {
        while (position < pdfHeight) {
          pdf.addImage(imgData, "JPEG", 0, -position, pdfWidth, pdfHeight);
          position += pageHeight;
          if (position < pdfHeight) pdf.addPage();
        }
      }

      const pdfBlob = pdf.output("blob");
      resolve(pdfBlob);
    } catch (err) {
      reject(err);
    }
  });
};

export const generatePOD = async (
  orderNumber: string,
  TourId: any,
  driverId: number,
) => {
  if (!TourId) {
    console.log("Tour ID is required.");
    return;
  }

  try {
    const routeRes = await adminApiService.fetchRouteSegmentData(TourId);
    const routeImagesRes = await adminApiService.fetchRouteSegmentImages(
      TourId,
      orderNumber,
    );
    const orderDetailsRes =
      await adminApiService.fetchSpecifiedOrder(orderNumber);
    // const driverDetailsRes = await adminApiService.getDriverData(driverId);

    // console.log(driverDetailsRes);
    const orderDetail = orderDetailsRes.data;

    const orderData = {
      orderDetails: orderDetail[0],
      orderImages: routeImagesRes.data,
      segmentData: routeRes.data,
      // driverData: driverDetailsRes.data
    };

    console.log(orderData);
    const emailHtml = await PODEmailHtml(orderData); // ✅ unwrap Promise<string>
    let fullEmailHtml =
      "Dear,<br><br> Please find attached POD for your reference.";

    // 🔁 1. Create a hidden container
    let element = document.createElement("div");
    element.innerHTML = emailHtml; // ✅ now `element` is declared
    element.style.position = "absolute";
    element.style.left = "-9999px";
    element.style.top = "0";
    element.style.width = "800px"; // match your content width
    element.style.backgroundColor = "white"; // avoid transparency issues
    document.body.appendChild(element);

    let config = {
      orientation: "p", // Portrait orientation
      unit: "mm",
      format: "a4",
    };

    let pdfBlob = await generatePdfFromElement(element, config);
    let attachment = await blobToBase64(pdfBlob);
    let attachment_name = "POD.pdf";

    await adminApiService.sendEmail({
      to: "raja.zainulabadin@vendomnia.com",
      subject: "POD",
      html: fullEmailHtml,
      attachment,
      attachment_name,
    });

    // console.log(routeImagesRes);
  } catch (error) {
    console.error("Error fetching orders:", error);
  }
};

export const generateTimeOptions = () =>
  Array.from({ length: (24 - 7) * 2 }, (_, i) => {
    const hour = 7 + Math.floor(i / 2);
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${String(hour).padStart(2, "0")}:${minutes}`;
  });
