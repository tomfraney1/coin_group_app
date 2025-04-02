import { ProductHierarchy, ProductGrade, ProductSku } from '../types/product';

const STORAGE_KEY = 'product_hierarchies';

class ProductHierarchyService {
  private hierarchies: Map<string, ProductHierarchy> = new Map();
  private listeners: Set<(hierarchies: ProductHierarchy[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const hierarchies = JSON.parse(stored);
        this.hierarchies = new Map(Object.entries(hierarchies));
      }
    } catch (error) {
      console.error('Error loading hierarchies from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const hierarchies = Object.fromEntries(this.hierarchies);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hierarchies));
    } catch (error) {
      console.error('Error saving hierarchies to storage:', error);
    }
  }

  // Add a new product hierarchy
  addProductHierarchy(coinId: string, gradingService: string, enrichedData: any): void {
    const firstLetter = gradingService.charAt(0).toUpperCase();
    const hierarchyId = `${coinId}-${firstLetter}`;
    
    // Create or get existing hierarchy
    let hierarchy = this.hierarchies.get(hierarchyId);
    if (!hierarchy) {
      hierarchy = {
        id: hierarchyId,
        coinId,
        gradingService,
        description: enrichedData.description,
        children: [],
      };
      this.hierarchies.set(hierarchyId, hierarchy);
    }

    // Create or update grade level
    const gradeId = `${hierarchyId}-${enrichedData.grade.replace(/^MS/, '')}`;
    let grade = hierarchy.children.find(g => g.id === gradeId);
    if (!grade) {
      grade = {
        id: gradeId,
        grade: enrichedData.grade.replace(/^MS/, ''),
        description: enrichedData.description,
        children: [],
      };
      hierarchy.children.push(grade);
    }

    // Create or update SKU level - remove leading zeros from certification number
    const skuId = enrichedData.certificationNumber.replace(/^0+/, '');
    let sku = grade.children.find(s => s.id === skuId);
    if (!sku) {
      sku = {
        id: skuId,
        certificationNumber: enrichedData.certificationNumber.replace(/^0+/, ''), // Remove leading zeros
        description: enrichedData.description,
        metadata: {
          year: enrichedData.year,
          denomination: enrichedData.denomination,
          mint: enrichedData.mint,
          composition: enrichedData.composition,
          designer: enrichedData.designer,
          diameter: enrichedData.diameter,
          weight: enrichedData.weight,
          edge: enrichedData.edge,
          mintage: enrichedData.mintage,
          metalContent: enrichedData.metalContent,
          mintLocation: enrichedData.mintLocation,
          priceGuideValue: enrichedData.priceGuideValue,
          population: enrichedData.population,
          varieties: enrichedData.varieties,
          pcgsNumber: enrichedData.pcgsNumber,
          seriesName: enrichedData.seriesName,
          category: enrichedData.category,
          coinFactsLink: enrichedData.coinFactsLink,
          coinFactsNotes: enrichedData.coinFactsNotes,
        },
      };
      grade.children.push(sku);
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  // Get all hierarchies
  getHierarchies(): ProductHierarchy[] {
    return Array.from(this.hierarchies.values());
  }

  // Subscribe to hierarchy changes
  subscribe(listener: (hierarchies: ProductHierarchy[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const hierarchies = this.getHierarchies();
    this.listeners.forEach(listener => listener(hierarchies));
  }

  // Delete a product hierarchy by certification number
  deleteProductHierarchy(certificationNumber: string): void {
    // Remove leading zeros for comparison
    const normalizedCertNumber = certificationNumber.replace(/^0+/, '');
    
    // Iterate through all hierarchies
    for (const [hierarchyId, hierarchy] of this.hierarchies.entries()) {
      // Check each grade level
      hierarchy.children = hierarchy.children.filter(grade => {
        // Check each SKU level
        grade.children = grade.children.filter(sku => {
          const skuCertNumber = sku.certificationNumber.replace(/^0+/, '');
          return skuCertNumber !== normalizedCertNumber;
        });
        // Keep grade if it still has children
        return grade.children.length > 0;
      });
      
      // Remove hierarchy if it has no grades left
      if (hierarchy.children.length === 0) {
        this.hierarchies.delete(hierarchyId);
      }
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  // Delete all product hierarchies
  deleteAllProductHierarchies(): void {
    this.hierarchies.clear();
    this.saveToStorage();
    this.notifyListeners();
  }
}

export const productHierarchyService = new ProductHierarchyService(); 