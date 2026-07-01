export interface Application {
  id: number;
  applicantName: string;
  email: string;
  phone: string;
  currentAddressStreet: string;
  currentAddressCity: string;
  currentAddressState: string;
  currentAddressZip: string;
  currentAddressSinceDate: string;
  householdIncome: number;
  moveInDate: string;
  totalOccupancy: number;
  landlordName: string;
  landlordPhone: string;
  additionalInfo?: string;
  propertyName: string;
  propertyId: number;
  status?: string;
  createdAt: string;
}
