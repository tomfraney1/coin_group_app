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
    this.baseUrl = `${API_URL}/api/spot-price`;
  }

  async getAllProducts(type?: 'fixed' | 'percentage'): Promise<SpotPriceProduct[]> {
    const url = type ? `${this.baseUrl}?type=${type}` : this.baseUrl;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
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
    return response.json();
  }

  async createProduct(product: Omit<SpotPriceProduct, 'id'>): Promise<SpotPriceProduct> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error('Failed to create product');
    }
    return response.json();
  }

  async updateProduct(id: number, product: Partial<SpotPriceProduct>): Promise<SpotPriceProduct> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      throw new Error('Failed to update product');
    }
    return response.json();
  }

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
    return response.json();
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
    return response.json();
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
    return response.json();
  }
}

export const spotPriceService = new SpotPriceService(); 