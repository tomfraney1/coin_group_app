import { enrichCoin } from '../services/coinEnrichmentService';
import { findCoinByBarcode } from '../utils/csvParser';
import { CoinData } from '../types/coin';

// Mock the csvParser module
jest.mock('../utils/csvParser');
const mockFindCoinByBarcode = findCoinByBarcode as jest.MockedFunction<typeof findCoinByBarcode>;

describe('Coin Enrichment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if coin is not found in database', async () => {
    mockFindCoinByBarcode.mockReturnValue(null);
    await expect(enrichCoin('123456')).rejects.toThrow('Coin not found in database');
  });

  it('should successfully enrich coin data from CSV', async () => {
    const mockCsvData = {
      Coin_id: 'SAE025',
      Grade: 'BU',
      Description: '2025 $1 Silver American Eagle BU',
      Qty: '5020',
      Certification_no: '123456',
      Ownership: '108',
      Grading_Serv: 'Other',
      Type: 'B'
    };

    mockFindCoinByBarcode.mockReturnValue(mockCsvData);

    const result = await enrichCoin('SAE025');
    expect(result).toEqual({
      grade: 'BU',
      description: '2025 $1 Silver American Eagle BU',
      mint: undefined,
      year: '2025',
      denomination: undefined,
      composition: undefined,
      designer: undefined,
      diameter: undefined,
      weight: undefined,
      edge: undefined,
      mintage: undefined,
      metalContent: undefined,
      mintLocation: undefined,
      priceGuideValue: undefined,
      population: undefined,
      varieties: undefined,
      pcgsNumber: undefined,
      certNumber: '123456',
      seriesName: undefined,
      category: 'B',
      coinFactsLink: undefined,
      coinFactsNotes: undefined,
      auctionList: undefined
    } as CoinData['enrichedData']);
  });

  it('should handle special grade values', async () => {
    const mockCsvData = {
      Coin_id: 'AMCC21',
      Grade: '**',
      Description: '2021 AMAC Challenge Coin **',
      Qty: '2918',
      Certification_no: '',
      Ownership: '104',
      Grading_Serv: 'Other',
      Type: ''
    };

    mockFindCoinByBarcode.mockReturnValue(mockCsvData);

    const enrichedData = await enrichCoin('AMCC21');
    expect(enrichedData).toBeDefined();
    expect(enrichedData).toHaveProperty('grade', undefined);
    expect(enrichedData).toHaveProperty('year', '2021');
  });
}); 