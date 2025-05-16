type PicklistData = {
  driver: {
    driver_name: string;
    mobile: string;
  };
  orders: {
    order_number: string;
    items: {
      slmdl_articleordernumber: string;
      quantity: number;
    }[];
  }[];
};

type AggregatedItems = {
  [key: string]: number;
};

export const generatePicklistEmailHtml = (
  picklistData: PicklistData,
  aggregatedItems: AggregatedItems,
  totalQuantity: number
) => {
  const headerColor =  '#f37021';
 
  const emailContent = `

    <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 800px; margin: auto; background-color: #ffffff; border: 1px solid #ddd;">

      <h2 style="text-align: center; color: ${headerColor};">PICKLIST</h2>

      <div style="padding: 15px; margin-bottom: 20px;">
        <table style="width: 100%; font-size: 14px; background: linear-gradient(135deg, #e8eaed,rgb(125, 134, 145));">
          <tr>
            <td><strong>Location:</strong> ESCHWEGE</td>
            <td><strong>Driver:</strong> ${picklistData?.driver?.driver_name}</td>
          </tr>
          <tr>
            <td><strong>Licence Plate:</strong> ESW-SN600</td>
            <td><strong>Email:</strong> yousef.alomar@vendomnia.com</td>
          </tr>
          <tr>
            <td><strong>Phone:</strong> ${picklistData?.driver?.mobile}</td>
            <td><strong>ZIP Code:</strong> 30-31</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Date:</strong></td>
          </tr>
          <tr>
            <td colspan="2" style="padding-left: 20px;">Montag - 05.05.2025 - Tag 1</td>
          </tr>
          <tr>
            <td colspan="2" style="padding-left: 20px;">Dienstag - 06.05.2025 - Tag 2</td>
          </tr>
        </table>
      </div>

      <h3 style="margin-top: 30px; color: ${headerColor};">Order Item Details</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: linear-gradient(45deg, #f7941d 30%, #f37021 90%);" >
            <th style="border: 1px solid #ccc; padding: 8px; color: white;">ITEM</th>
            <th style="border: 1px solid #ccc; padding: 8px; color: white;">QUANTITY</th>
            <th style="border: 1px solid #ccc; padding: 8px; color: white;">ORDER NO</th>
            <th style="border: 1px solid #ccc; padding: 8px; color: white;">✔️</th>
          </tr>
        </thead>
        <tbody>
          ${picklistData?.orders?.map(order =>
            order.items.map(item => `
              <tr>
                <td style="border: 1px solid #ccc; padding: 8px;">${item.slmdl_articleordernumber}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${item.quantity}</td>
                <td style="border: 1px solid #ccc; padding: 8px;">${order.order_number}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-size: 25px;">&#x2610;</td>
              </tr>
            `).join('')
          ).join('')}
        </tbody>
      </table>

      <h3 style="margin-top: 30px; color: ${headerColor};">Total Pickup Items</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <thead>
          <tr style="background: linear-gradient(45deg, #f7941d 30%, #f37021 90%);">
            <th style="border: 1px solid #ccc; padding: 8px; color: white;">TOTAL ITEM</th>
            <th style="border: 1px solid #ccc; padding: 8px; color: white;">TOTAL QUANTITY</th>
            <th style="border: 1px solid #ccc; padding: 8px; color: white;">✔️</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(aggregatedItems).map(([articleNumber, qty]) => `
            <tr>
              <td style="border: 1px solid #ccc; padding: 8px;">${articleNumber}</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center;">${qty}</td>
              <td style="border: 1px solid #ccc; padding: 8px; text-align: center; font-size: 25px;">&#x2610;</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="2" style="text-align: right; padding: 26px 10px 0px 0px;"><strong>Total Solar Panels: ${totalQuantity}</strong></td>
          </tr>
        </tbody>
      </table>
      <br>
      <table style="width: 100%; font-size: 14px; margin-top: 40px;">
        <tr>
          <td style="width: 50%; padding-right: 20px; text-align: center">
            <strong>Warehouse signature:</strong><br><br><br><br><br><br>
            __________________________________
          </td>
          <td>
          </td>
          <td style="width: 50%; padding-left: 20px; text-align: center">
            <strong>Driver signature:</strong><br><br><br><br><br><br>
            ________________________________
          </td>
        </tr>
      </table>
    </div>

  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Picklist Email</title>
      </head>
      <body>
        ${emailContent}
      </body>
    </html>
  `;
};
