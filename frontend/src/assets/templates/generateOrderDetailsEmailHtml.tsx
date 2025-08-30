type PicklistData = {
  warehouseName: string;
  tour_name: string;
  driver: {
    driver_name: string;
    mobile: string;
    licenceplate: string;
    email: string;
  };
  orders: {
    order_number: string;
    street: string;
    phone: string;
    zipcode: string;
    city: string;
    note: string;
    items: {
      slmdl_articleordernumber: string;
      quantity: number;
    }[];
  }[];
};

export const generateOrderDetailsEmailHtml = (picklistData: PicklistData) => {
  const headerColor = "#ef972e";

  const ordersRowsHtml = picklistData.orders
    .map((order, index) => {
      // Join article numbers comma separated
      const itemNumbers = order.items.map(item => item.slmdl_articleordernumber).join(", ");

      // Sum quantities
      const totalQuantity = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      return `
        <tr>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${index + 1}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${order.street || ""}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${order.phone || ""}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${order.zipcode || ""}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${order.city || ""}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${itemNumbers}</td>
          <td style="border: 1px solid #ccc; padding: 8px;">${order.order_number || ""}</td>
          <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${totalQuantity}</td>
        </tr>
      `;
    })
    .join("");

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 100%; margin: auto; background: white;padding: 30px;">
      <h6 style="text-align: left;font-weight: bold;font-family: Arial, sans-serif;font-size: 18.5px;">
        ${picklistData.tour_name}
      </h6>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background-color: ${headerColor}; color: white; text-align: center;">
            <th style="border: 1px solid #ccc; padding: 8px;">Position in Tour</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Straße</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Ansprechpartner Telefonnummer</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Postleitzahl</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Stadt</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Notiz</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Referenz</th>
            <th style="border: 1px solid #ccc; padding: 8px;">Menge</th>
          </tr>
        </thead>
        <tbody>
          ${ordersRowsHtml}
        </tbody>
      </table>
    </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Order Details</title>
      </head>
      <body>
        ${emailContent}
      </body>
    </html>
  `;
};
