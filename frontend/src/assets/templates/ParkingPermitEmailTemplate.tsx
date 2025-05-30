import React from 'react';
import ReactDOMServer from 'react-dom/server';

interface FormData {
  salutation: string;
  firstName: string;
  lastName: string;
  street: string;
  postalCode: string;
  city: string;
  orderNumber: string;
  parkingLocation: string;
  email: string;
  verificationCode: string;
  termsAgreed: string;
  privacyAgreed: string;
}

interface EmailProps {
  formData: FormData;
  signatureData: string;
  greetingText: string;
}

const ParkingPermitEmailTemplate: React.FC<EmailProps> = ({ formData, signatureData, greetingText }) => (
  <div style={{
    fontFamily: 'Helvetica, Arial, sans-serif',
    padding: '20px',
    backgroundColor: '#f7f7f7',
    borderRadius: '12px',
    width: '650px',
    margin: 'auto',
    boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
  }}>
    {/* Header Section */}
    <div style={{
      backgroundColor: '#ef972e',
      color: '#fff',
      textAlign: 'center',
      padding: '30px 20px',
      borderTopLeftRadius: '12px',
      borderTopRightRadius: '12px',
    }}>
      <h1 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color:'#ffffff' }}>Abgabegenehmigung</h1>
    </div>

    {/* Content Section (Table) */}
    <div style={{
      backgroundColor: '#ffffff',
      padding: '30px',
      borderRadius: '8px',
      marginTop: '-20px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    }}>
    
    {/* Greeting */}
    {greetingText && (
      <div
        style={{ marginBottom: '30px', fontSize: '16px', color: '#333' }}
        dangerouslySetInnerHTML={{ __html: greetingText }}
      />
    )}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginBottom: '20px',
      }}>
        <thead>
          <tr style={{
            backgroundColor: '#ef972e',
            color: '#fff',
            textAlign: 'left',
            padding: '10px 20px',
            fontSize: '16px',
            fontWeight: '600',
          }}>
            <th style={{ padding: '10px 20px' }}>Field</th>
            <th style={{ padding: '10px 20px' }}>Value</th>
          </tr>
        </thead>
        <tbody>
          {[
            ['Anrede', formData.salutation],
            ['Vorname', formData.firstName],
            ['Nachname', formData.lastName],
            ['Straße', formData.street],
            ['Postleitzahl', formData.postalCode],
            ['Stadt', formData.city],
            ['Bestellnummer', formData.orderNumber],
            ['Abstellort', formData.parkingLocation],
            ['eMail Adresse', formData.email],
            ['Allgemeine Geschäftsbedingungen', formData.termsAgreed],
            ['Datenschutzrichtlinie', formData.privacyAgreed],
          ].map(([label, value], index) => (
            <tr key={index} style={{
              backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#ffffff',
              borderBottom: '1px solid #ddd',
            }}>
              <td style={{
                padding: '12px 20px',
                fontWeight: '500',
                color: '#333',
              }}>{label}</td>
              <td style={{
                padding: '12px 20px',
                color: '#555',
              }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Footer Section */}
    <div style={{
      backgroundColor: '#f0f0f0',
      textAlign: 'center',
      padding: '15px',
      marginTop: '30px',
      borderBottomLeftRadius: '12px',
      borderBottomRightRadius: '12px',
    }}>
      <p style={{ fontSize: '14px', color: '#888', margin: 0 }}>
        © {new Date().getFullYear()} Sunniva. All rights reserved.
      </p>
    </div>
  </div>

);

const EmailSignature = '<div class=rd-mail-signature style=font-family:Helvetica,Arial,Calibri,Sans-Serif;font-size:12px;margin:0;padding:0><table style=font-size:12px;border-spacing:0 class=rd-top-info><tr><td>--<tr><td style=font-size:12px;line-height:10px;padding-bottom:5px>Mit freundlichen Grüßen / Best Regards<tr><td style=font-size:12px;line-height:10px><br></table><table style=font-size:12px;border-spacing:0 class=rd-top-info><tr><tr><td style=font-size:12px;line-height:10px;padding-bottom:5px><span class=rd-name style="font-size:12px;font-weight:700;padding-bottom:5px;border-bottom:2px solid #f69328"></span></table><table style=font-size:12px;border-spacing:0><tr><tr><tr><td><span class=rd-mail><img src=https://vendomnia.com/media/image/71/fb/86/envelope_gr.png><a href=mailto:service@vendomnia.com>service@vendomnia.com</a></span><tr><td><span class=rd-mail><img src=https://vendomnia.com/media/image/71/fb/86/envelope_gr.png><a href=mailto:service@sunniva-solar.de>service@sunniva-solar.de</a></span><tr><td><img src=https://vendomnia.com/media/image/73/69/be/web_gr.png><a href=https://www.vendomnia.com>www.vendomnia.com</a><tr><td><img src=https://vendomnia.com/media/image/73/69/be/web_gr.png><a href=www.sunniva-solar.de>www.sunniva-solar.de</a></table><br><br><img src=https://vendomnia.com/media/image/c2/56/da/sunniva_logo.png alt="Sunniva GmbH"><br><br><table style=font-size:12px;border-spacing:0><tr><td style=font-weight:600><img src="https://ci3.googleusercontent.com/meips/ADKq_NYZMr0zl4BJs1uV6wY5e_10bQFWLOAsKAceTqqPJhmtct11GRnjm4s8dzR-Fv1E6h0wMauk7zpp72PBCmpRJtKuJgGWaWQMrA=s0-d-e1-ft#https://www.vendomnia.rs/images/ger_flag_small.png"> Sunniva GmbH<tr><td>Honer Straße 49<tr><td>37269 Eschwege<tr><td>Germany</table><br><br><table style="font-size:12px;border-spacing:0;border-bottom:2px solid #f69328"><tr><td>VAT Identification Number: DE328448044<tr><td>Commercial Register Number: HRB 206120<tr><td>Amtsgericht Göttingen<tr><td>VerpackG Register Nummer: DE1381538064420<tr><td>ElektroG WEEE Register Nummer: DE53396155<tr><td>BATTG Register Nummer: DE62881384<tr><td><br></table></div>';


export const getParkingPermitEmailHTML = (formData: FormData, signatureData: string, greetingText:string ): string => {
  const htmlString = ReactDOMServer.renderToStaticMarkup(
    <ParkingPermitEmailTemplate formData={formData} signatureData={signatureData} greetingText={greetingText} />
  );
  return `<!DOCTYPE html>
<html>
<body>
  ${htmlString}
  ${EmailSignature}
</body>
</html>`;
};
