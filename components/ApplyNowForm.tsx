'use client';

import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Property } from '@/lib/types';

interface ApplyNowFormProps {
  property: Property;
  applicantName: string;
  setApplicantName: (value: string) => void;
  applicantEmail: string;
  setApplicantEmail: (value: string) => void;
  applicantPhone: string;
  setApplicantPhone: (value: string) => void;
  currentAddressStreet: string;
  setCurrentAddressStreet: (value: string) => void;
  currentAddressCity: string;
  setCurrentAddressCity: (value: string) => void;
  currentAddressState: string;
  setCurrentAddressState: (value: string) => void;
  currentAddressZip: string;
  setCurrentAddressZip: (value: string) => void;
  currentAddressSinceDate: string;
  setCurrentAddressSinceDate: (value: string) => void;
  householdIncome: string;
  setHouseholdIncome: (value: string) => void;
  moveInDate: string;
  setMoveInDate: (value: string) => void;
  totalOccupancy: string;
  setTotalOccupancy: (value: string) => void;
  landlordName: string;
  setLandlordName: (value: string) => void;
  landlordPhone: string;
  setLandlordPhone: (value: string) => void;
  additionalInfo: string;
  setAdditionalInfo: (value: string) => void;
  acknowledgeQuickApplication: boolean;
  setAcknowledgeQuickApplication: (value: boolean) => void;
  applicationLoading: boolean;
  applicationError: string;
  applicationSuccess: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
}

export default function ApplyNowForm({
  property,
  applicantName,
  setApplicantName,
  applicantEmail,
  setApplicantEmail,
  applicantPhone,
  setApplicantPhone,
  currentAddressStreet,
  setCurrentAddressStreet,
  currentAddressCity,
  setCurrentAddressCity,
  currentAddressState,
  setCurrentAddressState,
  currentAddressZip,
  setCurrentAddressZip,
  currentAddressSinceDate,
  setCurrentAddressSinceDate,
  householdIncome,
  setHouseholdIncome,
  moveInDate,
  setMoveInDate,
  totalOccupancy,
  setTotalOccupancy,
  landlordName,
  setLandlordName,
  landlordPhone,
  setLandlordPhone,
  additionalInfo,
  setAdditionalInfo,
  acknowledgeQuickApplication,
  setAcknowledgeQuickApplication,
  applicationLoading,
  applicationError,
  applicationSuccess,
  onSubmit,
}: ApplyNowFormProps) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div id="apply-now" className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Apply Now</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="property-applying-for" className="block text-sm font-medium text-gray-700 mb-1">
            Property Applying For
          </label>
          <input
            id="property-applying-for"
            type="text"
            value={property.name}
            disabled
            className="w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-700"
          />
        </div>

        {/* Applicant Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="applicant-name" className="block text-sm font-medium text-gray-700 mb-1">
              Applicant Full Name
            </label>
            <input
              id="applicant-name"
              type="text"
              value={applicantName}
              onChange={(event) => setApplicantName(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="applicant-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="applicant-email"
              type="email"
              value={applicantEmail}
              onChange={(event) => setApplicantEmail(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="applicant-phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="applicant-phone"
              type="tel"
              value={applicantPhone}
              onChange={(event) => setApplicantPhone(event.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Income and Move-in Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="household-income" className="block text-sm font-medium text-gray-700 mb-1">
              Household Income
            </label>
            <input
                id="household-income"
                type="number"
                min="0"
                step="0.01"
                value={householdIncome}
                onChange={(event) => setHouseholdIncome(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="move-in-date" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Move-in Date 
            </label>
            <input
                id="move-in-date"
                type="date"
                value={moveInDate}
                onChange={(event) => setMoveInDate(event.target.value)}
                min={today}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="total-occupancy" className="block text-sm font-medium text-gray-700 mb-1">
              Total Number of Occupancy <span className="italic text-gray-500">(Include all adults and children)</span>
            </label>
            <input
                id="total-occupancy"
                type="number"
                min="1"
                value={totalOccupancy}
                onChange={(event) => setTotalOccupancy(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Current Address */}
        <div className="border-t border-gray-300 pt-4 mt-2">
          <h3 className="font-medium text-gray-700 mb-4">Current Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label htmlFor="current-address-since-date" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="italic text-gray-500">(How long have you lived at this address?)</span>
              </label>
              <input
                id="current-address-since-date"
                type="date"
                value={currentAddressSinceDate}
                onChange={(event) => setCurrentAddressSinceDate(event.target.value)}
                max={today}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="current-address-street" className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                id="current-address-street"
                type="text"
                placeholder="Street Address"
                value={currentAddressStreet}
                onChange={(event) => setCurrentAddressStreet(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              id="current-address-city"
              type="text"
              placeholder="City"
              value={currentAddressCity}
              onChange={(event) => setCurrentAddressCity(event.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              id="current-address-state"
              type="text"
              placeholder="State"
              value={currentAddressState}
              onChange={(event) => setCurrentAddressState(event.target.value)}
              required
              maxLength={2}
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
            <input
              id="current-address-zip"
              type="text"
              placeholder="Zip Code"
              value={currentAddressZip}
              onChange={(event) => setCurrentAddressZip(event.target.value)}
              required
              className="rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Landlord Information */}
        <div className="border-t border-gray-300 pt-4 mt-2">
          <h3 className="font-medium text-gray-700 mb-4">Landlord Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="landlord-name" className="block text-sm font-medium text-gray-700 mb-1">
                Landlord Name
              </label>
              <input
                id="landlord-name"
                type="text"
                value={landlordName}
                onChange={(event) => setLandlordName(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="landlord-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Landlord Phone
              </label>
              <input
                id="landlord-phone"
                type="tel"
                value={landlordPhone}
                onChange={(event) => setLandlordPhone(event.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <label htmlFor="additional-info" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Information <span className="text-sm text-gray-500">(Optional)</span>
          </label>
          <textarea
            id="additional-info"
            value={additionalInfo}
            onChange={(event) => setAdditionalInfo(event.target.value)}
            placeholder="Any additional information you'd like to share about your application..."
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {applicationError && (
          <div className="rounded-md border border-red-300 bg-red-100 px-3 py-2 text-red-700">
            {applicationError}
          </div>
        )}
        {applicationSuccess && (
          <div className="rounded-md border border-green-300 bg-green-100 px-3 py-2 text-green-700">
            {applicationSuccess}
          </div>
        )}

        <div className="flex items-start gap-2">
          <input
            id="quick-application-acknowledgment"
            type="checkbox"
            checked={acknowledgeQuickApplication}
            onChange={(event) => setAcknowledgeQuickApplication(event.target.checked)}
            required
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="quick-application-acknowledgment" className="text-sm text-gray-700">
            I understand this is phase one of the application. If my application meets the requirements, I will be required to complete additional background checks and provide additional information.
          </label>
        </div>

        <div>
          <Button type="submit" disabled={applicationLoading || !acknowledgeQuickApplication} className="px-6 font-bold">
            {applicationLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
}
