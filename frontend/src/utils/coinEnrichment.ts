import { CoinData } from '../types/coin';

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

let csvData: CsvCoinData[] | null = null;

const PCGS_API_TOKEN = 'XKafvR4Sa-5fRBtCWxkxy8VdNBPWFgl7-LAjb5XG-zXtoeqYpoxdT1yTHZh_qeLqVR4_LgHxIkXUypL-YRCh3_MfKU54DAvM_w-HX3J6RNr56ncbVl-ClXO6F8LwmhEGiP_sYJq_l3Nn4ad5v5Y5tZoKNj-KaF5JkLzJzpqGeyxaD1XlgWhBNTVn8lj4L7MuPeWIkVnkHHNdMcalrGEh3lm5xFgtBEOyia0m_NbYqtEi6hg7CvjSUDOjF775_B9ngQPMC1H1moNi-NCGamZ1vaxdFtfo2r9_qiT4GbA4CB6DuNC9';

// Function to load CSV data from a URL
const loadCsvFromUrl = async (url: string): Promise<void> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch product database');
    const text = await response.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',');
    
    csvData = rows.slice(1).map(row => {
      const values = row.split(',');
      return {
        Coin_id: values[0],
        Grade: values[1],
        Description: values[2],
        Qty: values[3],
        Certification_no: values[4],
        Ownership: values[5],
        Grading_Serv: values[6],
        Type: values[7]
      };
    });
    
    console.log(`Loaded ${csvData.length} coins from product database`);
  } catch (error) {
    console.error('Error loading product database:', error);
    throw error;
  }
};

// Load product database on startup
loadCsvFromUrl('/data/product_database.csv').catch(error => {
  console.error('Failed to load product database:', error);
});

// Keep the existing loadCsvData function for backward compatibility
export const loadCsvData = async (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(',');
        
        csvData = rows.slice(1).map(row => {
          const values = row.split(',');
          return {
            Coin_id: values[0],
            Grade: values[1],
            Description: values[2],
            Qty: values[3],
            Certification_no: values[4],
            Ownership: values[5],
            Grading_Serv: values[6],
            Type: values[7]
          };
        });
        
        console.log(`Loaded ${csvData.length} coins from product database`);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read product database file'));
    reader.readAsText(file);
  });
};

export const enrichCoinData = async (barcode: string): Promise<Partial<CoinData['enrichedData']>> => {
  if (!csvData) {
    throw new Error('Product database not loaded');
  }

  console.log('Looking up coin in product database:', barcode);
  
  // Get the last 7 digits of the barcode for matching
  const lastSevenDigits = barcode.slice(-7);
  console.log('Last 7 digits of barcode:', lastSevenDigits);
  
  // Find matching coin in CSV data
  const matchingCoin = csvData.find(coin => {
    const certLastSeven = coin.Certification_no.slice(-7);
    console.log('Comparing certification numbers:', {
      barcodeLastSeven: lastSevenDigits,
      certLastSeven: certLastSeven,
      fullCertNumber: coin.Certification_no
    });
    return certLastSeven === lastSevenDigits;
  });

  if (!matchingCoin) {
    throw new Error('Coin not found in product database');
  }

  console.log('Found matching coin in product database:', {
    ...matchingCoin,
    Certification_no: matchingCoin.Certification_no
  });

  return {
    coinId: matchingCoin.Coin_id,
    grade: matchingCoin.Grade,
    description: matchingCoin.Description,
    quantity: parseInt(matchingCoin.Qty, 10),
    certificationNumber: matchingCoin.Certification_no,
    gradingService: matchingCoin.Grading_Serv,
    type: matchingCoin.Type,
  };
};

const enrichFromPcgsApi = async (barcode: string, gradingService: string): Promise<Partial<CoinData['enrichedData']>> => {
  try {
    console.log(`Fetching PCGS data for barcode: ${barcode}, grading service: ${gradingService}`);
    
    const url = `https://api.pcgs.com/publicapi/coindetail/GetCoinFactsByBarcode?barcode=${barcode}&gradingService=${gradingService}`;
    console.log('PCGS API URL:', url);
    
    const headers = {
      'Authorization': `Bearer ${PCGS_API_TOKEN}`,
      'Accept': 'application/json',
    };
    console.log('PCGS API Headers:', headers);
    
    const response = await fetch(url, { headers });
    console.log('PCGS API Response Status:', response.status);
    console.log('PCGS API Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PCGS API Error Response:', errorText);
      throw new Error(`PCGS API error: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('PCGS API Raw Response:', JSON.stringify(data, null, 2));

    if (!data || !data.IsValidRequest) {
      console.warn('PCGS API returned invalid response');
      return {};
    }

    // Map PCGS API response to our enrichedData structure
    const mappedData = {
      grade: data.Grade,
      description: data.Name,
      mint: data.MintMark,
      year: data.Year?.toString(),
      denomination: data.Denomination,
      composition: data.MetalContent,
      designer: data.Designer,
      diameter: data.Diameter?.toString(),
      weight: data.Weight?.toString(),
      edge: data.Edge,
      mintage: data.Mintage?.toString(),
      metalContent: data.MetalContent,
      mintLocation: data.MintLocation,
      priceGuideValue: data.PriceGuideValue?.toString(),
      population: data.Population?.toString(),
      varieties: data.MajorVariety || data.MinorVariety || data.DieVariety ? [
        data.MajorVariety,
        data.MinorVariety,
        data.DieVariety
      ].filter(Boolean) : undefined,
      pcgsNumber: data.PCGSNo,
      certNumber: data.CertNo,
      seriesName: data.SeriesName,
      category: data.Category,
      coinFactsLink: data.CoinFactsLink,
      coinFactsNotes: data.CoinFactsNotes,
      auctionList: data.AuctionList
    };

    console.log('Mapped PCGS API Data:', mappedData);
    return mappedData;
  } catch (error) {
    console.error('Error fetching PCGS data:', error);
    throw error;
  }
};

export const enrichCoin = async (barcode: string): Promise<Partial<CoinData['enrichedData']>> => {
  console.log('Starting enrichment process for barcode:', barcode);
  
  try {
    // First try to enrich from CSV data to get basic info
    const csvEnrichedData = await enrichCoinData(barcode);
    console.log('CSV enrichment result:', csvEnrichedData);

    if (!csvEnrichedData) {
      throw new Error('Failed to enrich from product database');
    }

    // Store the product database description
    const productDbDescription = csvEnrichedData.description;

    // If we have a grading service from CSV data, use it for PCGS API
    if (csvEnrichedData.gradingService) {
      try {
        console.log('Attempting PCGS API enrichment with grading service:', csvEnrichedData.gradingService);
        const pcgsData = await enrichFromPcgsApi(barcode, csvEnrichedData.gradingService);
        console.log('PCGS API enrichment result:', pcgsData);

        // Only merge if we got meaningful data from PCGS
        if (pcgsData && Object.keys(pcgsData).length > 0) {
          console.log('Merging PCGS data with product database data');
          return {
            ...csvEnrichedData,
            ...pcgsData,
            // Keep the product database description
            description: productDbDescription,
            // Prioritize PCGS certification number if available
            certificationNumber: pcgsData.certNumber || csvEnrichedData.certificationNumber,
          };
        } else {
          console.log('No meaningful data from PCGS API, using product database data only');
          return csvEnrichedData;
        }
      } catch (pcgsError) {
        console.error('PCGS API enrichment failed:', pcgsError);
        console.log('Using product database data only');
        return csvEnrichedData;
      }
    }

    console.log('No grading service found in product database, using product database data only');
    return csvEnrichedData;
  } catch (error) {
    console.error('Enrichment failed:', error);
    throw error;
  }
}; 