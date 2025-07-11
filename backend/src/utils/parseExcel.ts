// utils/parseExcel.ts
import * as XLSX from "xlsx";
import fs from 'fs';

interface JobFromExcel {
  id: string;
  address: string;
  demand: number;
}

export const parseExcelToJobs = (filePath: string): JobFromExcel[] => {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = XLSX.utils.sheet_to_json<JobFromExcel>(sheet);

  // Optional: validate required fields
  return data.map((row: { address: any; demand: any; id: any; }, index: any) => {
    if (!row.address || !row.demand || !row.id) {
      throw new Error(`Invalid row at index ${index}: Missing id, address, or demand`);
    }
    return row;
  });
};
