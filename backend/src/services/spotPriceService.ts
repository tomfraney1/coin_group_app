import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCoinId,
  getProductsByMetal,
  getProductsByTypeAndMetal,
  SpotPriceProduct
} from '../models/spotPrice';

export class SpotPriceService {
  async getAllProducts(type?: 'fixed' | 'percentage'): Promise<SpotPriceProduct[]> {
    return getAllProducts(type);
  }

  async getProductById(id: number): Promise<SpotPriceProduct | null> {
    return getProductById(id);
  }

  async createProduct(product: Omit<SpotPriceProduct, 'id' | 'created_at' | 'updated_at'>): Promise<SpotPriceProduct> {
    return createProduct(product);
  }

  async updateProduct(id: number, product: Partial<SpotPriceProduct>): Promise<SpotPriceProduct | null> {
    return updateProduct(id, product);
  }

  async deleteProduct(id: number): Promise<void> {
    await deleteProduct(id);
  }

  async getProductsByCoinId(coinId: string): Promise<SpotPriceProduct[]> {
    return getProductsByCoinId(coinId);
  }

  async getProductsByMetal(metal: 'Gold' | 'Silver'): Promise<SpotPriceProduct[]> {
    return getProductsByMetal(metal);
  }

  async getProductsByTypeAndMetal(type: 'fixed' | 'percentage', metal: 'Gold' | 'Silver'): Promise<SpotPriceProduct[]> {
    return getProductsByTypeAndMetal(type, metal);
  }
}

export const spotPriceService = new SpotPriceService(); 