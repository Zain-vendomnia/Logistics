import React from 'react';
import ReactDOMServer from 'react-dom/server';

interface EmailProps {
  orderData: any;
  finalUrl: string;
  condition: number;
}

const OrderInitialEmailTemplate1: React.FC<EmailProps> = ({ 
  orderData,
  finalUrl,
 }) => (
   
   <div
        style={{
          fontFamily: "Arial, sans-serif",
          // fontSize: 16,
          color: "#333",
          lineHeight: 1.5,
          // maxWidth: 600,
          margin: "0 auto",
          // padding: 20,
          // border: "1px solid #ddd",
          // borderRadius: 8,
          // backgroundColor: "#f9f9f9",
        }}
      >
        <h2 style={{ color: "#007A4D" }}>
          📢 Gute Nachrichten! 🎉 Der erste Teil Ihrer Bestellung (ID: {orderData.order_number}) ist
          auf dem Weg zu Ihnen!
        </h2>

        <p>Hallo {orderData.firstname} {orderData.lastname},</p>

        <p>
          Mein Name ist <strong>Felix Herrmann</strong>. Ich bin bei <strong>SUNNIVA</strong> im
          Kundenservice tätig.
        </p>

        <p>
          Vielen Dank, dass Sie unser SUNNIVA Balkonkraftwerk erworben haben. Wir
          freuen uns, Sie als Kunden begrüßen zu dürfen.
        </p>

        <h3>Zubehörpaket (Wechselrichter und Kabel)</h3>
        <p>
          Das Zubehörpaket, bestehend aus Mikro Wechselrichter und Kabel, werden wir
          Ihnen mit dem Paketdienst Hermes zusenden.
        </p>
        <p>
          Die Sendungsnummer lautet <strong>{orderData.tracking_code}</strong> und kann über
          folgenden Link online nachverfolgt werden:
        </p>
        <p>
          <a href={finalUrl} target="_blank" rel="noopener noreferrer">
            {finalUrl}
          </a>
        </p>

        <h3>Die Solarmodule</h3>
        <p>
          Die Solarmodule werden separat verschickt. Da diese extrem groß, sperrig
          und zerbrechlich sind, können diese leider nicht mit einem Paketdienst
          versandt werden. Die Zustellung dauert daher leider immer etwas länger.
        </p>
        <p>
          Die längere Lieferzeit ist in dem Online Angebot erwähnt, wir versuchen
          aber, die Solarmodule schneller zu liefern. Hoffentlich schon nächste
          Woche :)
        </p>
        <p>
          Wir halten Sie auf dem Laufenden und geben Ihnen noch den genauen Tag der
          Zustellung bekannt.
        </p>

        <h3>Haben Sie Fragen?</h3>
        <p>Schreiben Sie uns. Wir helfen gerne!</p>

    </div>


);

const OrderInitialEmailTemplate2: React.FC<EmailProps> = ({ 
  orderData,
  finalUrl,
 }) => (
 <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px', lineHeight: '1.5', color: '#333' }}>

   <p>Gute Neuigkeiten 🎉</p>
   <p><strong>Ihre Bestellung - {orderData.tracking_code} ({orderData.order_number}) ist unterwegs!</strong></p>

   <p>Hallo {orderData.firstname} {orderData.lastname},</p>

   <p>
     Vielen Dank für den Kauf eines <strong>SUNNIVA Balkonkraftwerks</strong>. Wir freuen uns sehr,
     Sie als Kundin oder Kunde begrüßen zu dürfen! Gerne informieren wir Sie über den weiteren Ablauf.
   </p>

   <h3>Zubehörpaket (Wechselrichter und Kabel)</h3>
   <p>
     Das Zubehörpaket, bestehend aus Mikro-Wechselrichter und Kabel, wird Ihnen mit dem Paketdienst <strong>Hermes</strong> geliefert.
     Die Sendungsnummer lautet:
   </p>
   <p>
     <strong>{orderData.tracking_code}</strong>
     <br />
     <a
       href={`https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation#${orderData.tracking_code}`}
       target="_blank"
       rel="noopener noreferrer"
     >
       Sendung verfolgen
     </a>
   </p>

   <h3>Solarmodule</h3>
   <p>
     Die Solarmodule werden aufgrund ihrer Größe und ihres Gewichts separat geliefert.
   </p>
   <p><strong>Liefertermin: {orderData.order_time}</strong></p>
   <p>
     Bitte beachten Sie, dass die Lieferung der Solarmodule in dieser Woche nur zum oben genannten Termin möglich ist.
     Sollten Sie zu diesem Zeitpunkt nicht zu Hause sein, wählen Sie bitte eine der folgenden zwei Optionen:
   </p>

   <h4>Option 1: Abweichende Lieferadresse</h4>
   <p>
     Geben Sie uns für die Lieferung der Solarmodule eine alternative Lieferadresse an (z. B. die eines Nachbarn).
     Die alternative Lieferadresse muss allerdings im selben Ort wie der Ihre sein.
   </p>

   <h4>Option 2: Abstellgenehmigung erteilen</h4>
   <p>
     Sie können uns autorisieren, die Solarmodule an einem bestimmten Ort zu hinterlegen, z. B. vor Ihrer Haustür,
     in der Garage, im Carport, im Gartenschuppen oder hinter einem Zaun.
   </p>
   <p>
     Bitte nutzen Sie hierzu das folgende Formular und senden Sie es ausgefüllt und unterschrieben an uns zurück.
   </p>
   <p>
     <a
       href={`${finalUrl}`}
       target="_blank"
       rel="noopener noreferrer"
     >
       Abstellgenehmigung ausfüllen
     </a>
   </p>
   <p>
     Nach dem Absenden erhalten wir Ihre Erlaubnis automatisch und veranlassen die Lieferung entsprechend.
   </p>

   <p>Vielen Dank für Ihr Vertrauen in <strong>SUNNIVA</strong>!</p>

   <p>
     Bei Fragen einfach melden, gerne helfen wir Ihnen weiter.
   </p>

   <p>Mit freundlichen Grüßen,<br />
     <strong>Ruth Becker</strong><br />
     Kundensupport<br />
     SUNNIVA GmbH
   </p>
 </div>

);
const OrderInitialEmailTemplate3: React.FC<EmailProps> = ({ 
  orderData,
  finalUrl,
 }) => (
   
 <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '16px', lineHeight: 1.5, color: '#333' }}>
   <p>Hurra! Ihre Bestellung - <strong>{orderData.tracking_code} ({orderData.order_number})</strong> wurde vollständig versandt! 🚚</p>

   <p>Hallo {orderData.firstname} {orderData.lastname},</p>

   <p>
     Wir freuen uns, Ihnen mitteilen zu dürfen, dass wir Ihnen die Solarmodule am
   </p>

   <p style={{ fontWeight: 'bold', marginLeft: '1rem' }}>
     Liefertermin: {orderData.order_time}
   </p>

   <p>
     Bitte beachten Sie, dass die Lieferung der Solarmodule in dieser Woche nur zum oben genannten Termin möglich ist.
     Sollten Sie zu diesem Zeitpunkt nicht zu Hause sein, wählen Sie bitte eine der folgenden zwei Optionen:
   </p>

   <h4>Option 1: Abweichende Lieferadresse</h4>
   <p>
     Geben Sie uns für die Lieferung der Solarmodule eine alternative Lieferadresse an (z. B. die eines Nachbarn).
     Die alternative Lieferadresse muss allerdings im selben Ort wie der Ihre sein.
   </p>

   <h4>Option 2: Abstellgenehmigung erteilen</h4>
   <p>
     Sie können uns autorisieren, die Solarmodule Ware an einem bestimmten Ort zu hinterlegen, z. B. vor Ihrer Haustür,
     in der Garage, im Carport, im Gartenschuppen oder hinter einem Zaun.
   </p>
   <p>
     Bitte nutzen Sie hierzu das folgende Formular und senden Sie es ausgefüllt und unterschrieben an uns zurück.
   </p>

   <p>
     <a
       href={`${finalUrl}`}
       target="_blank"
       rel="noopener noreferrer"
       style={{ color: '#0070f3', textDecoration: 'underline' }}
     >
       Abstellgenehmigung ausfüllen
     </a>
   </p>

   <p>
     Nach dem Absenden erhalten wir Ihre Erlaubnis automatisch und veranlassen die Lieferung entsprechend.
   </p>

   <p>
     Vielen Dank für Ihr Verständnis und Ihre Mithilfe bei einer reibungslosen Zustellung.
     Bei Fragen oder wenn Sie Unterstützung benötigen, stehen wir Ihnen jederzeit gerne zur Verfügung.
   </p>

   <p>
     Vielen Dank, dass Sie sich für <strong>SUNNIVA</strong> entschieden haben!
   </p>

   <p>
     Mit freundlichen Grüßen<br />
     Ruth Becker,<br />
     Kundenservice<br />
     SUNNIVA GmbH
   </p>
 </div>

);

 const OrderInitialEmailTemplate4: React.FC<EmailProps> = ({ 
   orderData,
   finalUrl,
  }) => (
    
     <div
       style={{
          fontFamily: "Arial, sans-serif",
           // fontSize: 16,
           color: "#333",
           lineHeight: 1.5,
           // maxWidth: 600,
           margin: "0 auto",
           // padding: 20,
           // border: "1px solid #ddd",
           // borderRadius: 8,
           // backgroundColor: "#f9f9f9",
       }}
     >
       <h2 style={{ color: "#007A4D" }}>
         Hurra! Ihre Bestellung - {orderData.order_number} wurde vollständig versandt! 🚚
       </h2>

       <p>Hallo {orderData.firstname} {orderData.lastname},</p>

       <p>
         Wir freuen uns, Ihnen mitteilen zu dürfen, dass wir Ihnen die Solarmodule am
       </p>

       <p
         style={{
           fontWeight: "bold",
           fontSize: "1.1em",
           margin: "12px 0",
         }}
       >
         Liefertermin: {orderData.order_time}
       </p>


       <h3>Abstellgenehmigung erteilen</h3>
       <p>
         Sie können uns autorisieren, die Solarmodule Ware an einem bestimmten Ort zu
         hinterlegen, z. B. vor Ihrer Haustür, in der Garage, im Carport, im
         Gartenschuppen oder hinter einem Zaun.
       </p>
       <p>
         Bitte nutzen Sie hierzu das folgende Formular und senden Sie es ausgefüllt
         und unterschrieben an uns zurück.
       </p>

       <p>
         <a
           href={finalUrl}
           target="_blank"
           rel="noopener noreferrer"
           style={{ color: "#007A4D", fontWeight: "bold" }}
         >
           Abstellgenehmigung ausfüllen
         </a>
       </p>

       <p>
         Nach dem Absenden erhalten wir Ihre Erlaubnis automatisch und veranlassen
         die Lieferung entsprechend.
       </p>

       <p>
         Vielen Dank für Ihr Verständnis und Ihre Mithilfe bei einer reibungslosen
         Zustellung.
         <br />
         Bei Fragen oder wenn Sie Unterstützung benötigen, stehen wir Ihnen jederzeit
         gerne zur Verfügung.
       </p>

       <p>Vielen Dank, dass Sie sich für SUNNIVA entschieden haben!</p>


     </div>

 );
const EmailSignature = '<div class=rd-mail-signature style=font-family:Helvetica,Arial,Calibri,Sans-Serif;font-size:12px;margin:0;padding:0><table style=font-size:12px;border-spacing:0 class=rd-top-info><tr><td>--<tr><td style=font-size:12px;line-height:10px;padding-bottom:5px>Mit freundlichen Grüßen / Best Regards<tr><td style=font-size:12px;line-height:10px><br></table><table style=font-size:12px;border-spacing:0 class=rd-top-info><tr><tr><td style=font-size:12px;line-height:10px;padding-bottom:5px><span class=rd-name style="font-size:12px;font-weight:700;padding-bottom:5px;border-bottom:2px solid #f69328"></span></table><table style=font-size:12px;border-spacing:0><tr><tr><tr><td><span class=rd-mail><img src=https://vendomnia.com/media/image/71/fb/86/envelope_gr.png><a href=mailto:service@vendomnia.com>service@vendomnia.com</a></span><tr><td><span class=rd-mail><img src=https://vendomnia.com/media/image/71/fb/86/envelope_gr.png><a href=mailto:service@sunniva-solar.de>service@sunniva-solar.de</a></span><tr><td><img src=https://vendomnia.com/media/image/73/69/be/web_gr.png><a href=https://www.vendomnia.com>www.vendomnia.com</a><tr><td><img src=https://vendomnia.com/media/image/73/69/be/web_gr.png><a href=www.sunniva-solar.de>www.sunniva-solar.de</a></table><br><br><img src=https://vendomnia.com/media/image/c2/56/da/sunniva_logo.png alt="Sunniva GmbH"><br><br><table style=font-size:12px;border-spacing:0><tr><td style=font-weight:600><img src="https://ci3.googleusercontent.com/meips/ADKq_NYZMr0zl4BJs1uV6wY5e_10bQFWLOAsKAceTqqPJhmtct11GRnjm4s8dzR-Fv1E6h0wMauk7zpp72PBCmpRJtKuJgGWaWQMrA=s0-d-e1-ft#https://www.vendomnia.rs/images/ger_flag_small.png"> Sunniva GmbH<tr><td>Honer Straße 49<tr><td>37269 Eschwege<tr><td>Germany</table><br><br><table style="font-size:12px;border-spacing:0;border-bottom:2px solid #f69328"><tr><td>VAT Identification Number: DE328448044<tr><td>Commercial Register Number: HRB 206120<tr><td>Amtsgericht Göttingen<tr><td>VerpackG Register Nummer: DE1381538064420<tr><td>ElektroG WEEE Register Nummer: DE53396155<tr><td>BATTG Register Nummer: DE62881384<tr><td><br></table></div>';


export const getOrderInitialEmailHTML = (orderData:any, finalUrl:string, condition:number): string => {

  let template: React.ReactElement;

  if (condition === 2) {
    template = <OrderInitialEmailTemplate2 orderData={orderData} finalUrl={finalUrl} condition={condition} />;
  } 
  else if (condition === 3) {
    template = <OrderInitialEmailTemplate3 orderData={orderData} finalUrl={finalUrl} condition={condition} />;
  } 
  else if (condition === 4) {
    template = <OrderInitialEmailTemplate4 orderData={orderData} finalUrl={finalUrl} condition={condition} />;
  } 
  else {
    template = <React.Fragment />;
  }

  const htmlString = ReactDOMServer.renderToStaticMarkup(template);
  return `<!DOCTYPE html>
<html>
<body>
  ${htmlString}
  ${EmailSignature}
</body>
</html>`;
};
