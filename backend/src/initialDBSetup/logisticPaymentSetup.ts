import connect from "../database";
import { RowDataPacket } from "mysql2";
import { LOGIC_PAYMENT_TABLE } from "../services/tableQueries";

const logisticPaymentSetup = async () => {
  const conn = await connect();
  try {
    console.log("Checking if 'logistic_payment' table exists...");
    
    // Check if the table already exists
    const [rows] = await conn.query<RowDataPacket[]>("SHOW TABLES LIKE 'logistic_payment'");
    if (rows.length > 0) {
      console.log("Table 'logistic_payment' already exists.");
    } else {
      console.log("Table not found. Creating 'logistic_payment' table...");
      
      // Execute the query to create the table
      await conn.query(LOGIC_PAYMENT_TABLE);
      console.log("Table 'logistic_payment' successfully created.");
    }
    
    // Insert predefined records if table was just created
    console.log("Inserting predefined records into 'logistic_payment'...");
    const insertQuery = `
      INSERT IGNORE INTO logistic_payment (id, name, description) VALUES
        (2, 'debit', 'Debit'),
        (3, 'cash', 'Cash'),
        (4, 'invoice', 'Invoice'),
        (5, 'Vorkasse', 'Vorkasse'),
        (6, 'sepa', 'SEPA'),
        (7, '30% deposit', '30% deposit, balance paid against the copy of orig...'),
        (8, 'magnalister - eBay', 'magnalister - eBay'),
        (9, 'PayPal', 'PayPal'),
        (10, 'SwagPaymentPayPalUnified', 'PayPal'),
        (11, 'SwagPaymentPayPalUnifiedInstallments', 'Ratenzahlung Powered by PayPal'),
        (12, 'Amazon Payment', 'Amazon Payment'),
        (13, 'MoneyXferAcceptedInCheckout', 'MoneyXferAcceptedInCheckout'),
        (14, 'eBay', 'eBay'),
        (15, 'eBayPayments', 'eBayPayments'),
        (16, 'Bezahlung per Überweisung (Vorkasse)', 'Bezahlung per Überweisung (Vorkasse)'),
        (17, 'Hood.de', 'Hood.de'),
        (18, 'Klarna', 'Klarna'),
        (19, 'METRO', 'METRO'),
        (20, 'Kaufland', 'Kaufland'),
        (21, 'Wayfair', 'Wayfair'),
        (22, 'OTTO', 'OTTO'),
        (23, 'amazon_pay_checkout', 'Amazon Pay Checkout'),
        (24, 'SwagPaymentPayPalUnifiedPayUponInvoice', 'Kauf auf Rechnung'),
        (25, 'SwagPaymentPayPalUnifiedAdvancedCreditDebitCard', 'Kredit- oder Debitkarte'),
        (26, 'SwagPaymentPayPalUnifiedSepa', 'Lastschrift');
    `;
    
    await conn.query(insertQuery);
    console.log("Predefined records inserted successfully.");
  } catch (error) {
    console.error("Error during table setup:", error instanceof Error ? error.message : String(error));
  } finally {
    conn.end();
  }
};

export default logisticPaymentSetup;
