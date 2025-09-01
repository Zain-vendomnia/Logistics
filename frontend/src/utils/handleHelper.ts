import React, { useEffect, useState, useCallback, useMemo } from 'react';
import adminApiService from '../services/adminApiService';
import latestOrderServices from '../components/Admin/AdminServices/latestOrderServices';
// import { showSnackbar } from './utils';  // Assuming you have a showSnackbar utility function
import { getOrderInitialEmailHTML } from '../assets/templates/OrderInitialEmails';

// Function to handle sending parking permit emails
export const handlePermit = async (permitTourIds: string[]) => {

  const instance = latestOrderServices.getInstance();
  const toursdata = await instance.getTours();
  const idNumbers = permitTourIds.map(id => Number(id));  // Get the IDs of selected tours
  const matchedTours = toursdata.filter((tour: any) => idNumbers.includes(tour.id)); // Filter the tours based on the selected IDs
  const allOrders = matchedTours.flatMap((tour: any) => tour.orders);  // Extract all orders from matched tours


  try {
    // Send an email to each order's customer
    for (const order of allOrders) {

      const orderNumber = order.order_number;

      // Generate the URL for the parking permit form
      const baseUrl = `${window.location.protocol}//${window.location.host}/ParkingPermitForm`;
      const encodedOrderNumber = btoa(orderNumber); // Base64 encode the order number
      const finalUrl = `${baseUrl}?o=${encodedOrderNumber}`;

      const trackingCode = order.tracking_code;
      let html = '';
      let condition = 0;
      let triggerMail = false;
      let subject = '';
      // Format the order delivery time
      const formattedTime = formatDeliveryWindow(order.order_time);
      order.order_time = formattedTime;

      const metaData = await adminApiService.getOrderNotificationMetaData(order.order_number);

      // ✅ Correctly access the array inside the API response
      const metaArray = metaData.data.data;

      console.log(' <================ LINE = 40 : FILE = handleHelper.ts ==============>', metaArray,order.order_number);

      console.log(' <================ LINE = 44 : FILE = handleHelper.ts ==============>', order);
      // ✅ Safeguard: Check if it's an array before using `.some`
      if (Array.isArray(metaArray)) {
        const isCase1 = metaArray.some(
          (meta: { meta_key: string; meta_value: string }) =>
            meta.meta_key === 'customer_initial_email_case' && meta.meta_value === 'case_1'
        );
        console.log(' <================ LINE = 47 : FILE = handleHelper.ts ==============>', isCase1);
        if (isCase1) {
          console.log(' <================ LINE = 50 : FILE = handleHelper.ts ==============>', 'Trriger Case 3');

          condition = 3;
          subject = 'Hurra! Ihre Bestellung - ${order.tracking_code} (${order.order_number}) wurde vollständig versandt!🚚';
          triggerMail = true;
        }
      } else {
        console.log(' <================ LINE = 53 : FILE = handleHelper.ts ==============>', 'Trigger Case 2');
          condition = 2;
          subject = 'Gute Neuigkeiten 🎉 Ihre Bestellung - ${order.tracking_code} (${order.order_number}) ist unterwegs!';
          triggerMail = true;
      }


      if (triggerMail == true) {

        console.log(' <================ LINE = 69 : FILE = handleHelper.ts ==============>', order , 'case 2');
        // Generate the email HTML content
        html = getOrderInitialEmailHTML(order, finalUrl, condition);

        // Send the email
        await adminApiService.sendEmail({
          to: 'muhammad.jahanzaibbaloch@vendomnia.com',  // Replace with actual email
          subject: subject,
          html,
        });

      }
      // Determine the condition for the email content
      if (trackingCode && order.order_status_id !== 10006) {
        condition = 1;
      } else if (!trackingCode && order.order_status_id !== 10006) {
        condition = 2;
      } else if (order.order_status_id === 10006) {
        condition = 3;
      }

    }

  } catch (error) {
    console.error('Error sending emails:', error);
  }
};

// Helper function to format the delivery window (just an example)
const formatDeliveryWindow = (isoString: string): string => {
  const startDate = new Date(isoString);
  const endDate = new Date(startDate.getTime() + 30 * 60000); // Add 30 minutes

  // Format date
  const day = String(startDate.getUTCDate()).padStart(2, '0');
  const month = String(startDate.getUTCMonth() + 1).padStart(2, '0');
  const year = startDate.getUTCFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  // Format time helper
  const formatTime = (date: Date): string => {
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
  };

  const startTime = formatTime(startDate);
  const endTime = formatTime(endDate);

  return  `${formattedDate} (${startTime}) zwischen ${endTime}`;
};