import { API_URL } from '../config';

export interface SpotPriceProduct {
  id?: number;
  coinId: string;
  metal: 'Gold' | 'Silver';
  ounces: number;
  amount: number;
  type: 'fixed' | 'percentage';
}

class SpotPriceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_URL}/spot-price`;
  }

  private transformProduct(product: any): SpotPriceProduct {
    return {
      id: product.id,
      coinId: product.coin_id,
      metal: product.metal,
      ounces: product.ounces,
      amount: product.amount,
      type: product.type
    };
  }

  async getAllProducts(type?: 'fixed' | 'percentage'): Promise<SpotPriceProduct[]> {
    const url = type ? `${this.baseUrl}?type=${type}` : this.baseUrl;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const products = await response.json();
    return products.map(this.transformProduct);
  }

  async getProductById(id: number): Promise<SpotPriceProduct> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch product');
    }
    const product = await response.json();
    return this.transformProduct(product);
  }

  async createProduct(product: Omit<SpotPriceProduct, 'id'>): Promise<SpotPriceProduct> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        coin_id: product.coinId,
        metal: product.metal,
        ounces: product.ounces,
        amount: product.amount,
        type: product.type
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    const createdProduct = await response.json();
    return this.transformProduct(createdProduct);
  }

  async updateProduct(id: number, product: Partial<SpotPriceProduct>): Promise<SpotPriceProduct> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        coin_id: product.coinId,
        metal: product.metal,
        ounces: product.ounces,
        amount: product.amount,
        type: product.type
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    const updatedProduct = await response.json();
    return this.transformProduct(updatedProduct);
  }

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Failed to delete product');
    }
  }

  async getProductsByCoinId(coinId: string): Promise<SpotPriceProduct[]> {
    const response = await fetch(`${this.baseUrl}/coin/${coinId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const products = await response.json();
    return products.map(this.transformProduct);
  }

  async getProductsByMetal(metal: 'Gold' | 'Silver'): Promise<SpotPriceProduct[]> {
    const response = await fetch(`${this.baseUrl}/metal/${metal}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const products = await response.json();
    return products.map(this.transformProduct);
  }

  async getProductsByTypeAndMetal(type: 'fixed' | 'percentage', metal: 'Gold' | 'Silver'): Promise<SpotPriceProduct[]> {
    const response = await fetch(`${this.baseUrl}/type/${type}/metal/${metal}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    const products = await response.json();
    return products.map(this.transformProduct);
  }
}

export const spotPriceService = new SpotPriceService(); 