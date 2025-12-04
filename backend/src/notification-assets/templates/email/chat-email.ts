// Email HTML template builder
export const buildEmailTemplate = (message: string, customerName?: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SUNNIVA</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding: 20px 30px; background-color: #1a1a2e; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">SUNNIVA</h1>
      </td>
    </tr>
    
    <!-- Body -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${customerName || 'Valued Customer'},
        </p>
        <div style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
          ${message}
        </div>
      </td>
    </tr>
    
    <!-- Signature -->
    <tr>
      <td style="padding: 0 30px 40px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="border-top: 1px solid #eeeeee; padding-top: 20px;">
              <p style="color: #333333; font-size: 14px; line-height: 1.6; margin: 0;">
                Best Regards,<br>
                <strong>SUNNIVA Solar Team</strong>
              </p>
              <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 15px 0 0 0;">
                Sunniva Solar Management LLC<br>
                Dubai, UAE<br>
                <a href="mailto:support@vendomnia.com" style="color: #1a1a2e;">support@vendomnia.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f8f8; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} Sunniva Solar Management LLC. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};