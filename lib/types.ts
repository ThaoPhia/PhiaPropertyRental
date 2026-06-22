export interface Property {
  id: number;
  name: string;
  type: 'duplex' | 'apartment' | 'other';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  price: number;
  description: string;
  image_url?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyFormData {
  name: string;
  type: 'duplex' | 'apartment' | 'other';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  price: number;
  description: string;
  image_url?: string;
}

