import * as XLSX from "xlsx";
import fs from "fs";
import { LogisticOrder } from "../model/LogisticOrders";
import { Warehouse } from "../types/warehouse.types";
import { OrderDetails } from "../types/order.types";

interface JobFromExcel {
  id: string;
  address: string;
  demand: number;
}

export const parseExcelToJobs = (filePath: string): JobFromExcel[] => {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json<JobFromExcel>(sheet);

  // Optional: validate required fields
  return data.map((row: { address: any; demand: any; id: any }, index: any) => {
    if (!row.address || !row.demand || !row.id) {
      throw new Error(
        `Invalid row at index ${index}: Missing id, address, or demand`
      );
    }
    return row;
  });
};

const REQUIRED_COLUMNS = [
  "Name",
  "Straße",
  "Postleitzahl",
  "Stadt",
  "Telefonnummer",
  "NOTIZ",
  "MENGE",
  "REFERENZ",
  "Warehouse",
];

export function parseExcelBufferToOrders(
  fileBuffer: Buffer,
  warehouseList: Warehouse[]
): LogisticOrder[] {
  console.log("Excel Parsing Started");

  // Parse workbook from buffer
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert sheet to JSON with all values as string
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false, // ensures every cell is returned as string
  });

  if (rows.length === 0) {
    throw new Error("Excel sheet is empty");
  }

  // Validate required columns (case-insensitive)
  const normalizedKeys = Object.keys(rows[0]).map((k) => k.toLowerCase());
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !normalizedKeys.includes(col.toLowerCase())
  );
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns: ${missingColumns.join(", ")}`);
  }

  const errors: string[] = [];
  const orders: LogisticOrder[] = [];

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const rowNum = index + 2; // +2 because Excel rows start at 1 and row 1 is headers

    const rowErrors: string[] = [];
    // Row-level validations
    if (!row["Name"]) rowErrors.push(`Row ${rowNum}: Missing Name`);
    if (!row["REFERENZ"]) rowErrors.push(`Row ${rowNum}: Missing REFERENZ`);
    if (!row["Warehouse"]) rowErrors.push(`Row ${rowNum}: Missing Warehouse`);

    // Skip mapping this row if it has errors
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      continue; // skip this row but continue processing others
    }

    const expectedDelivery = new Date();
    expectedDelivery.setDate(expectedDelivery.getDate() + 14);

    const Eschwege_wahrehouse = warehouseList.find(
      (wh) => wh.town === "Eschwege"
    );
    // Match warehouse
    const warehouseId =
      warehouseList.find(
        (wh) =>
          wh.town.trim().toLowerCase() === row["Warehouse"].trim().toLowerCase()
      )?.id ?? Eschwege_wahrehouse?.id;

    console.log("warehouse Id found: ", warehouseId);

    if (!warehouseId) {
      errors.push(`Row ${rowNum}: Warehouse "${row["Warehouse"]}" not found`);
      continue;
    }

    // Split name into first/last (safe default)
    const nameParts = row["Name"].trim().split(" ");
    const firstname = nameParts[0] || "";
    const lastname = nameParts.slice(1).join(" ") || "";

    // Parse order items
    const orderItems: OrderDetails[] = [];
    const notiz = row["NOTIZ"].trim();

    if (notiz.includes(",")) {
      const items = notiz.split(",");
      for (const qItem of items) {
        const qDetail = qItem.split("x").map((s) => s.trim());
        if (qDetail.length !== 2) {
          errors.push(`Row ${rowNum}: Invalid NOTIZ item format "${qItem}"`);
          continue;
        }
        orderItems.push({
          order_id: 0,
          order_number: row["REFERENZ"],
          slmdl_article_id: "",
          slmdl_articleordernumber: qDetail[1],
          slmdl_quantity: Number(qDetail[0]) || 0,
          warehouse_id: warehouseId!,
        });
      }
    } else {
      orderItems.push({
        order_id: 0,
        order_number: row["REFERENZ"],
        slmdl_article_id: "",
        slmdl_articleordernumber: notiz,
        slmdl_quantity: Number(row["MENGE"]) || 0,
        warehouse_id: warehouseId!,
      });
    }

    const order: LogisticOrder = {
      order_id: 0,
      quantity: 0,
      article_order_number: "",
      article_sku: "",
      lattitude: null,
      longitude: null,
      shopware_order_id: row["REFERENZ"],
      order_number: row["REFERENZ"],
      customer_id: "",
      invoice_amount: "",
      payment_id: 0,
      tracking_code: "",
      order_status_id: 0,
      warehouse_id: warehouseId!,
      order_time: new Date(),
      expected_delivery_time: expectedDelivery,
      customer_number: row["Telefonnummer"],
      firstname,
      lastname,
      email: "",
      street: row["Straße"],
      zipcode: row["Postleitzahl"],
      city: row["Stadt"],
      phone: row["Telefonnummer"],
      OrderDetails: orderItems,
    };

    orders.push(order);
  }

  if (errors.length > 0) {
    // throw new Error(errors.join("; "));
    console.error("Errors Processing Excel Orders: ", errors.join("; "));
  }

  return orders;
}
