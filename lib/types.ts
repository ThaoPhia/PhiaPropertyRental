export interface Property {
  id: number;
  name: string;
  type: 'duplex' | 'apartment' | 'other';
  status: 'available' | 'occupied' | 'coming soon' | 'removed';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  details: string;
  highlights: PropertyHighlight[];
  dateAvailable: string | null;
  image_url?: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyFormData {
  name: string;
  type: 'duplex' | 'apartment' | 'other';
  status: 'available' | 'occupied' | 'coming soon' | 'removed';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  monthlyRent: number;
  details: string;
  dateAvailable: string;
  image_url?: string;
}

export interface PropertyHighlight {
  icon: string; // icon component name (e.g., GarageIcon)
  text: string;
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
