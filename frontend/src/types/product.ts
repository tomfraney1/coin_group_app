export interface ProductHierarchy {
  id: string; // coin_id + grading_service_first_letter (e.g., "009852-P")
  coinId: string;
  gradingService: string;
  description?: string;
  children: ProductGrade[];
}

export interface ProductGrade {
  id: string; // coin_id + grading_service_first_letter + grade (e.g., "009852-P-70")
  grade: string;
  description?: string;
  children: ProductSku[];
}

export interface ProductSku {
  id: string; // cert_number (e.g., "49681252")
  certificationNumber: string;
  description?: string;
  metadata?: {
    year?: string;
    denomination?: string;
    mint?: string;
    composition?: string;
    designer?: string;
    diameter?: string;
    weight?: string;
    edge?: string;
    mintage?: string;
    metalContent?: string;
    mintLocation?: string;
    priceGuideValue?: string;
    population?: string;
    varieties?: string[];
    pcgsNumber?: string;
    seriesName?: string;
    category?: string;
    coinFactsLink?: string;
    coinFactsNotes?: string;
  };
} 