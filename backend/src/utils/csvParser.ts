import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

interface CsvCoinData {
  Coin_id: string;
  Grade: string;
  Description: string;
  Qty: string;
  Certification_no: string;
  Ownership: string;
  Grading_Serv: string;
  Type: string;
}

export function findCoinByBarcode(barcode: string): CsvCoinData | null {
  try {
    const workspaceRoot = '/Users/tomfraney/coin_group_app';
    const csvPath = path.join(workspaceRoot, 'frontend', 'public', 'data', 'product_database.csv');
    console.log('Looking for CSV file at:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at path:', csvPath);
      return null;
    }

    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records: CsvCoinData[] = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Loaded ${records.length} records from CSV`);

    // Get the last 7 digits of the barcode
    const lastSevenDigits = barcode.slice(-7);
    console.log('Looking for coin with last 7 digits:', lastSevenDigits);

    // Find matching coin using last 7 digits of certification number
    const coin = records.find(record => {
      if (!record.Certification_no) {
        console.log('Record has no certification number:', record);
        return false;
      }
      
      const certLastSeven = record.Certification_no.slice(-7);
      const isMatch = certLastSeven === lastSevenDigits;
      
      if (isMatch) {
        console.log('Found matching coin:', {
          barcodeLastSeven: lastSevenDigits,
          certLastSeven: certLastSeven,
          fullCertNumber: record.Certification_no,
          coinId: record.Coin_id,
          description: record.Description
        });
      }
      
      return isMatch;
    });

    if (!coin) {
      console.log('No matching coin found for barcode:', barcode);
      // Log a few sample certification numbers for debugging
      console.log('Sample certification numbers from first 5 records:', 
        records.slice(0, 5).map(r => r.Certification_no));
    }

    return coin || null;
  } catch (error) {
    console.error('Error reading or parsing CSV:', error);
    return null;
  }
} 