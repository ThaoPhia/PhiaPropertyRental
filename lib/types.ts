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
  images?: string[];
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

export type UserRole = 'admin' | 'user';

export interface AuthenticatedAdmin {
  id: number;
  email: string;
  role: UserRole;
}

export interface AuthUserRecord {
  id: number;
  email: string;
  password_hash: string;
  role: UserRole;
}
