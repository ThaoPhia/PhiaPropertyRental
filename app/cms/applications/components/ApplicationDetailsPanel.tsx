import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Application } from '../types';

interface ApplicationDetailsPanelProps {
  selectedApplication: Application | null;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
}

export function ApplicationDetailsPanel({
  selectedApplication,
  onApprove,
  onDecline,
}: ApplicationDetailsPanelProps) {
  if (!selectedApplication) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        Select an application to view details
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
        {selectedApplication.status && (
          <Badge
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize border-0 ${
              selectedApplication.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : selectedApplication.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {selectedApplication.status}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-600">Applicant Name</p>
          <p className="text-lg font-semibold text-gray-900">
            {selectedApplication.applicantName}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Email</p>
          <p className="text-lg text-gray-900">
            <a href={`mailto:${selectedApplication.email}`} className="text-blue-600 hover:underline">
              {selectedApplication.email}
            </a>
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Phone</p>
          <p className="text-lg text-gray-900">
            <a href={`tel:${selectedApplication.phone}`} className="text-blue-600 hover:underline">
              {selectedApplication.phone}
            </a>
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Household Income</p>
          <p className="text-lg font-semibold text-gray-900">
            ${selectedApplication.householdIncome.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Occupancy & Move-in</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Occupancy</p>
            <p className="text-lg font-semibold text-gray-900">
              {selectedApplication.totalOccupancy}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Move-in Date</p>
            <p className="text-lg text-gray-900">
              {new Date(selectedApplication.moveInDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Current Address</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Street Address</p>
            <p className="text-lg text-gray-900">
              {selectedApplication.currentAddressStreet}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">City</p>
            <p className="text-lg text-gray-900">
              {selectedApplication.currentAddressCity}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">State</p>
            <p className="text-lg text-gray-900">
              {selectedApplication.currentAddressState}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Zip Code</p>
            <p className="text-lg text-gray-900">
              {selectedApplication.currentAddressZip}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Living There Since</p>
            <p className="text-lg text-gray-900">
              {new Date(selectedApplication.currentAddressSinceDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 pt-4 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-4">Landlord Information</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Landlord Name</p>
            <p className="text-lg text-gray-900">
              {selectedApplication.landlordName}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Landlord Phone</p>
            <p className="text-lg text-gray-900">
              <a href={`tel:${selectedApplication.landlordPhone}`} className="text-blue-600 hover:underline">
                {selectedApplication.landlordPhone}
              </a>
            </p>
          </div>
        </div>
      </div>

      {selectedApplication.additionalInfo && (
        <div className="border-t border-gray-300 pt-4 mb-6">
          <p className="text-sm text-gray-600">Additional Information</p>
          <p className="text-lg text-gray-900 whitespace-pre-wrap">
            {selectedApplication.additionalInfo}
          </p>
        </div>
      )}

      <div className="border-t border-gray-300 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">Property</p>
          <p className="text-lg text-gray-900">
            <Link
              href={`/properties/${selectedApplication.propertyId}`}
              className="text-blue-600 hover:underline"
            >
              {selectedApplication.propertyName}
            </Link>
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600">Applied On</p>
          <p className="text-lg text-gray-900">
            {new Date(selectedApplication.createdAt).toLocaleDateString()}{' '}
            {new Date(selectedApplication.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="border-t pt-6 flex gap-3">
        <Button
          onClick={() => onApprove(selectedApplication.id)}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          Approve
        </Button>
        <Button
          onClick={() => onDecline(selectedApplication.id)}
          variant="destructive"
          className="flex-1"
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
