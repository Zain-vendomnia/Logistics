/**
 * Convert a byte array to base64
 */
function byteArrayToBase64(byteArray: number[]): string {
  try {
    const uint8Array = new Uint8Array(byteArray);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error('Failed to convert byte array to base64:', e);
    return '';
  }
}

/**
 * Generate HTML content for POD Email with validated and compressed images
 */
export const PODEmailHtml = async (orderData: any): Promise<string> => {
  if (!orderData || !orderData.orderDetails) {
    console.error('Invalid order data.');
    return '<p>Ungültige Bestelldaten</p>';
  }

  const orderDetails = orderData.orderDetails;

  const getImageBase64 = async (primaryType: string, fallbackType?: string): Promise<string | null> => {
    const findImage = (type: string) => {
      return orderData.orderImages?.find((img: { type: string; image: any }) => img.type === type);
    };

    const primary = findImage(primaryType);
    const fallback = fallbackType ? findImage(fallbackType) : null;

    const selected = primary || fallback;

    if (selected && selected.image?.data && Array.isArray(selected.image.data)) {
      try {
        const rawBase64 = byteArrayToBase64(selected.image.data);
        return rawBase64;
      } catch (e) {
        console.warn(`Failed to convert image for type ${selected.type}`, e);
        return null;
      }
    }

    return null;
  };


  const [
    doorStep,
    deliveredItem,
    deliveredItemModal,
    signature,
    map,
    driverLocation
  ] = await Promise.all([
    getImageBase64('customer_door_step', 'neighbour_door_step'),
    getImageBase64('customer_delivered_item', 'neighbour_delivered_item'),
    getImageBase64('customer_delivered_item_modal', 'neighbour_delivered_item_modal'),
    getImageBase64('customer_signature', 'neighbour_signature'),
    getImageBase64('map'),
    getImageBase64('driver_location')
  ]);


  const safe = (value: any) => value ?? '-';

  const now = new Date();
  const formattedDate = now.toLocaleDateString('de-DE'); // e.g. 24.09.2025
  const formattedTime = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true, // Use 12-hour format with AM/PM
  });


  return `
    <div style="font-family: Arial, sans-serif; margin:10px; padding:10px; background:#fff;">
      <p style="font-size:12px; color:#555; margin-top:0; margin-bottom:30px; text-align:center;">
        Dieser Nachweis wurde maschinell erstellt und ist ohne Unterschrift gültig.
      </p>
      <div style="margin:30px;">
        <!-- Header -->
        <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
          <tr>
            <td align="left" valign="top" style="width:70%;">
              <h2 style="margin:0; font-size:20px;">Nachweis</h2>
              <p style="margin:0; font-weight:bold;">SUNNIVA GmbH</p>
              <p style="margin:0;">Honer Straße 49</p>
              <p style="margin:0;">37269 Eschwege</p>
            </td>
            <td align="right" valign="top" style="width:30%;">
              <img style="margin-top:30px;" src="/sunniva.png" alt="Sunnivas Logo" width="200" />
            </td>
          </tr>
        </table>

        <!-- Info Table -->
        <table width="100%" cellspacing="0" cellpadding="10" border="1" style="border-collapse:collapse; margin-top:15px; font-size:14px;">
          <tr><td style="width:30%; font-weight:bold;">Status</td><td><img src="https://img.icons8.com/color/20/checked--v1.png" alt="check" style="vertical-align:middle;"/> Erfolg</td></tr>
          <tr><td style="font-weight:bold;">Referenz</td><td>${safe(orderDetails.order_number)}</td></tr>
          <tr><td style="font-weight:bold;">Name</td><td>${safe(orderDetails.firstname)} ${safe(orderDetails.lastname)}</td></tr>
          <tr><td style="font-weight:bold;">Adresse</td><td>${safe(orderDetails.street)}, ${safe(orderDetails.zipcode)}, ${safe(orderDetails.city)}.</td></tr>
          <tr><td style="font-weight:bold;">Notiz</td><td>-</td></tr>
          <tr><td style="font-weight:bold;">Datum</td><td>${formattedDate}<img src="https://img.icons8.com/ios-filled/16/clock.png" alt="clock" style="margin-left:6px; vertical-align:middle;" /> ${formattedTime}</td></tr>
          <tr><td style="font-weight:bold;">Mitarbeiter</td><td><img src="https://img.icons8.com/ios-filled/16/user.png" alt="user" style="margin-right:6px; vertical-align:middle;"/> Sudad Algburi</td></tr>
          <tr><td style="font-weight:bold;">Aufgaben</td><td>Für diesen Nachweis wurden keine Aufgaben erfasst.</td></tr>
          <tr><td style="font-weight:bold;">Karte</td><td>${map ? `<img src="data:image/jpeg;base64,${map}" alt="Map" style="max-width:400px; height:auto;" />` : 'Nicht verfügbar'}</td></tr>
          <tr><td style="font-weight:bold;">Mitarbeiterstandort</td><td>${driverLocation ? `<img src="data:image/jpeg;base64,${driverLocation}" alt="Driver Location" style="max-width:400px; height:auto;" />` : 'Nicht verfügbar'}</td></tr>
          <tr><td style="font-weight:bold;">Menge</td><td>1</td></tr>
        </table>

        <!-- Attachments -->
        <h3 style="margin-top:30px; font-size:20px; font-weight:400; text-align:center;">Anhänge</h3>
        <table width="100%" cellspacing="0" cellpadding="10" border="1" style="border-collapse:collapse; margin-top:15px; font-size:14px;">
          <tr><td style="width:30%; font-weight:bold;">Door Step</td><td>${doorStep ? `<img src="data:image/jpeg;base64,${doorStep}" alt="Door Step" style="max-width:400px; height:auto;" />` : 'Nicht verfügbar'}</td></tr>
          <tr><td style="font-weight:bold;">Delivered</td><td>${deliveredItem ? `<img src="data:image/jpeg;base64,${deliveredItem}" alt="Delivered" style="max-width:400px; height:auto;" />` : 'Nicht verfügbar'}</td></tr>
          <tr><td style="font-weight:bold;">Delivered Modal</td><td>${deliveredItemModal ? `<img src="data:image/jpeg;base64,${deliveredItemModal}" alt="Delivered Modal" style="max-width:400px; height:auto;" />` : 'Nicht verfügbar'}</td></tr>
          <tr><td style="font-weight:bold;">Signature</td><td>${signature ? `<img src="data:image/jpeg;base64,${signature}" alt="Signature" style="max-width:400px; height:auto;" />` : 'Nicht verfügbar'}</td></tr>
        </table>
      </div>
    </div>
  `;
};
