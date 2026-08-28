import { ApplicationStatus } from './types';

export interface ApplicationPayload {
  propertyId: unknown;
  applicantName: unknown;
  email: unknown;
  phone: unknown;
  currentAddressStreet: unknown;
  currentAddressCity: unknown;
  currentAddressState: unknown;
  currentAddressZip: unknown;
  currentAddressSinceDate: unknown;
  householdIncome: unknown;
  moveInDate: unknown;
  totalOccupancy: unknown;
  landlordName: unknown;
  landlordPhone: unknown;
  additionalInfo: unknown;
  recaptchaToken: unknown;
}

export interface ApplicationStatusPayload {
  applicationId: unknown;
  status: unknown;
  additionalInfo?: unknown;
}

export interface ApplicationDeclinePayload {
  applicationId: unknown;
  reason: unknown;
}

export interface ApplicationRecord {
  id: number;
  email: string;
  applicant_name: string;
  property_name: string;
  property_id?: number;
  status?: ApplicationStatus;
}

export interface DeclinedApplicantNotificationTarget {
  id: number;
  email: string;
  applicant_name: string;
  property_name: string;
}
