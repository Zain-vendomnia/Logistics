import {
  EmailTemplate,
  sendEmail,
  sendSMS,
  sendWhatsAppMessage,
} from "../services/notificationService";

export const handleSendEmail = async () => {
  try {
    const data: EmailTemplate = {
      to: "nagaraj.gopalakrishnan@vendomnia.com",
      subject: "Order Arrival",
      templateName: "customer-notification",
      templateData: { name: "Jahanzaib Baloch" },
    };
    const response = await sendEmail(data);
    alert(`Email Sent: ${response}`);
  } catch (error) {
    alert(`Failed to send email : ${error}`);
  }
};

export const handleSendSMS = async () => {
  try {
    const response = await sendSMS("+18777804236", "customer-notification", {
      name: "Jahanzaib Baloch",
    });
    alert(`SMS Sent: ${response}`);
  } catch (error) {
    alert("Failed to send SMS");
  }
};

export const handleSendWhatsApp = async () => {
  try {
    const response = await sendWhatsAppMessage(
      "+971551246787",
      "customer-notification",
      { name: "Nagaraj" }
    );
    alert(`WhatsApp Sent: ${response}`);
  } catch (error) {
    alert("Failed to send WhatsApp message");
  }
};

//   const handleOnlyParkingPermit = async () => {
//     // setLoading(true);
//     const instance = latestOrderServices.getInstance();
//     const toursdata = await instance.getTours();
//     const idNumbers = permitTourIds.map((id) => Number(id)); // Get the IDs of selected tours
//     const matchedTours = toursdata.filter((tour: any) =>
//       idNumbers.includes(tour.id)
//     ); // Filter the tours based on the selected IDs
//     const allOrders = matchedTours.flatMap((tour: any) => tour.orders); // Extract all orders from matched tours

//     SingleOrderParkingPermit(allOrders[0]);
//   };

//   // Function to handle the send specific order parking permit email process
//   const SingleOrderParkingPermit = async (order: any) => {
//     // setLoading(true);
//     try {
//       // Send an email to each order's customer
//       const orderNumber = order.order_number;

//       // Use window.location.origin or env var
//       const baseUrl = `${window.location.protocol}//${window.location.host}/ParkingPermitForm`;

//       const encodedOrderNumber = btoa(orderNumber); // Or use Buffer.from if needed

//       const finalUrl = `${baseUrl}?o=${encodedOrderNumber}`;

//       let html = "";
//       let condition = 4;

//       const formattedTime = formatDeliveryWindow(order.expected_delivery_time);
//       order.order_time = formattedTime;

//       html = getOrderInitialEmailHTML(order, finalUrl, condition);

//       // const html = `Dear ${order.firstname} ${order.lastname},\n \n
//       // Please use the following form and return it to us completed and signed.
//       // Fill out the parking permit:\n
//       // ${finalUrl} \n \n
//       // Once submitted, we will automatically receive your permission and arrange delivery accordingly.`;

//       await adminApiService.sendEmail({
//         // to: order.email,
//         to: "muhammad.jahanzaibbaloch@vendomnia.com",
//         subject: "Parking Permit - Order #" + orderNumber,
//         html,
//       });

//       showSnackbar("Emails sent successfully", "success");
//     } catch (error) {
//       console.error("Error sending emails:", error);
//       showSnackbar("Failed to send emails", "error");
//     } finally {
//       // Close the modal after sending the emails
//       setLoading(false);
//       // setConfirmOpen(false);
//       setPermitTourIds([]);
//     }
//   };
