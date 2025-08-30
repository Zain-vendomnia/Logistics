type PicklistData = {
  tour_date: string;
  warehouseName: string;
  driver: {
    driver_name: string;
    mobile: string;
    licenceplate: string;
    email: string;
  };
  orders: {
    order_number: string;
    zipcode: string;
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
  const headerColor = "#ef972e";
  const formattedTourDate = picklistData?.tour_date
    ? new Date(picklistData.tour_date).toLocaleDateString('en-GB')
    : 'N/A';

  // ZIP Code formatting logic
  const formattedZipCodes = (() => {
    const uniqueZips = picklistData?.orders
      ?.map((order: { zipcode: string }) => order.zipcode)
      .filter((zip: string, index: number, self: string[]) => zip && self.indexOf(zip) === index);

    if (!uniqueZips || uniqueZips.length === 0) return 'N/A';

    return uniqueZips.length === 1
      ? uniqueZips[0]
      : uniqueZips.map((zip: string) => zip.slice(-2)).join(', ');
  })();

  // Merge logic
  const mergedItems: {
    [key: string]: { order_number: string; article: string; quantity: number };
  } = {};

  picklistData.orders.forEach(order => {
    order.items.forEach(item => {
      const key = `${order.order_number}_${item.slmdl_articleordernumber}`;
      if (mergedItems[key]) {
        mergedItems[key].quantity += item.quantity;
      } else {
        mergedItems[key] = {
          order_number: order.order_number,
          article: item.slmdl_articleordernumber,
          quantity: item.quantity
        };
      }
    });
  });
  
  const emailContent = `
    
    <div style="font-family: Raleway, sans-serif; color: #333; padding: 110px; max-width: 800px; margin: auto; background-color: #ffffff; color: #000">

      <div style="text-align: center; margin-bottom: 25px;">
          <img src="/sunniva.png" alt="Sunniva Logo" style="height: 52px;">
      </div>

    <h2 style="margin-left:265px; margin-bottom: 10px text-align: center; color: #000; font-size: 14px; font-weight: bold; display: inline-block; border-bottom: 1px solid #000; padding-bottom: 0.5px;">
      PICK LIST
    </h2>

      <div style="font-family: 'Raleway', Arial, sans-serif; color: #000; font-size: 13px; width: 430px;">
          <p style="font-family: Raleway, sans-serif; line-height: normal;">
            <strong>Location&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${picklistData.warehouseName ?? 'N/A'}<br />
            <strong>Driver&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${picklistData.driver.driver_name}<br />
            <strong>Licence plate&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${picklistData.driver.licenceplate  ?? 'N/A'}<br />
            <strong>Email&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${picklistData.driver.email   ?? 'N/A'}<br />
            <strong>Phone&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${picklistData.driver.mobile ?? 'N/A'}<br />
            <strong>ZIP Code&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${formattedZipCodes}<br />
            <strong>Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</strong> ${formattedTourDate}
          </p>
        </div>

      <table style="width: 80%; border-collapse: collapse; font-size: 14px; font-family: 'Arial'; margin-left: 11%;">
        <thead>
          <tr style="background-color: ${headerColor};">
            <th style="border: 1.5px solid #000; padding: 14px 20px 0px; color: white; text-align: center;">ITEM</th>
            <th style="border: 1.5px solid #000; padding: 14px 20px 0px; color: white; text-align: center;">QUANTITY</th>
            <th style="border: 1.5px solid #000; padding: 14px 20px 0px; color: white; text-align: center;">CHECK</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(aggregatedItems).map(([articleNumber, qty]) => `
            <tr>
              <td style="border: 1.5px solid #000; padding: 33px 8px; font-family: 'Raleway';">${articleNumber}</td>
              <td style="border: 1.5px solid #000; padding: 33px 8px; text-align: center; font-family: 'Raleway';">${qty}</td>
              <td style="border: 1.5px solid #000; padding: 33px 8px; text-align: center; font-family: 'Raleway';"></td>
            </tr>
          `).join('')}
          
        </tbody>
      </table>
      <br>
      <table style="width: 100%; font-size: 14px; margin-top: 40px;">
        <tr>
          <td style="width: 50%; padding-right: 20px; text-align: center">
            <strong>Warehouse signature:</strong><br><br><br><br><br><br>
            <div style="border-bottom: 1px solid #000; width: 80%; margin: auto;"></div>
          </td>
          <td>
          </td>
          <td style="width: 50%; padding-left: 20px; text-align: center">
            <strong>Driver signature:</strong><br><br><br><br><br><br>
            <div style="border-bottom: 1px solid #000; width: 80%; margin: auto;"></div>
          </td>
        </tr>
      </table>
         <br><br><br>
          <div style="border-top: 1px solid #333; padding-top: 10px; font-family: Raleway; font-size: 8px; line-height: normal;">
            <table width="100%" cellspacing="0" cellpadding="0" style="font-size: 9.5px;font-family: Raleway;">
              <tr valign="top">
                <td width="50%">
                  <strong>Sunniva GmbH</strong><br>
                  Honer Straße 49<br>
                  37269 Eschwege<br>
                  Deutschland<br>
                  Email: contact@sunniva-solar.de<br>
                  Website: www.sunniva-solar.de<br>
                  Telefon: +49 555 158175 65<br>
                  Fax: +49 555 158175 62
                </td>
                <td width="50%" align="right">
                  Handelsregister Nummer: HRB 206120<br>
                  Amtsgericht Göttingen<br>
                  Umsatzsteuer Ident Nummer: DE328448044<br>
                  VerpackG Register Nummer: DE1381538064420<br>
                  ElektroG Register Nummer: DE53396155<br>
                  BattG Register Nummer: DE62881384
                </td>
              </tr>
            </table>
          </div>
    </div>

  `;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
    <link src="https://fonts.googleapis.com/css2?family=Raleway&display=swap"/>
        <title>Picklist Email</title>
      </head>
      <body>
        ${emailContent}
      </body>
    </html>
  `;
};
