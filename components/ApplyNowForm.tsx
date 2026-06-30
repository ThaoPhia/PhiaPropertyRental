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
  householdIncome: string;
  setHouseholdIncome: (value: string) => void;
  moveInDate: string;
  setMoveInDate: (value: string) => void;
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
  householdIncome,
  setHouseholdIncome,
  moveInDate,
  setMoveInDate,
  applicationLoading,
  applicationError,
  applicationSuccess,
  onSubmit,
}: ApplyNowFormProps) {
  return (
    <div id="apply-now" className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Apply Now</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
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
        <div>
          <label htmlFor="applicant-name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
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
            Move-in Date
          </label>
          <input
            id="move-in-date"
            type="date"
            value={moveInDate}
            onChange={(event) => setMoveInDate(event.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {applicationError && (
          <div className="md:col-span-2 rounded-md border border-red-300 bg-red-100 px-3 py-2 text-red-700">
            {applicationError}
          </div>
        )}
        {applicationSuccess && (
          <div className="md:col-span-2 rounded-md border border-green-300 bg-green-100 px-3 py-2 text-green-700">
            {applicationSuccess}
          </div>
        )}
        <div className="md:col-span-2">
          <Button type="submit" disabled={applicationLoading} className="px-6 font-bold">
            {applicationLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
}
