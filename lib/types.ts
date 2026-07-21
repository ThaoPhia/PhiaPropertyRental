export enum PropertyStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  COMING_SOON = 'coming soon',
  REMOVED = 'removed',
}

export const PROPERTY_STATUS_OPTIONS = [
  PropertyStatus.AVAILABLE,
  PropertyStatus.OCCUPIED,
  PropertyStatus.COMING_SOON,
  PropertyStatus.REMOVED,
] as const;

export enum ApplicationStatus {
  NONE = '',
  PENDING = 'pending',
  APPROVED = 'approved',
  APPROVE_ARCHIVED = 'approve-archived',
  DECLINED = 'declined',
  DELETED = 'deleted',
}

export const APPLICATION_STATUS_OPTIONS = [
  ApplicationStatus.PENDING,
  ApplicationStatus.APPROVED,
  ApplicationStatus.APPROVE_ARCHIVED,
  ApplicationStatus.DECLINED,
  ApplicationStatus.DELETED,
] as const;

export interface Property {
  id: number;
  name: string;
  type: 'duplex' | 'apartment' | 'other';
  status: PropertyStatus;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: number;
  monthly_rent: number;
  details: string;
  highlights: PropertyHighlight[];
  date_available: string | null;
  image_url?: string;
  images?: string[];
  gallery_images?: PropertyImage[];
  created_at: Date;
  updated_at: Date;
}

export interface PropertyFormData {
  name: string;
  type: 'duplex' | 'apartment' | 'other';
  status: PropertyStatus;
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

export interface PropertyImage {
  url: string;
  description: string;
}

export type UserRole = 'admin' | 'user';

export interface AuthenticatedAdmin {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthUserRecord {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
}
