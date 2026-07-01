'use client';

import {Badge} from "@/components/ui/badge";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminSession } from '@/hooks/useAdminSession';

interface Application {
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

export default function ApplicationsPage() {
  const router = useRouter();
  const { admin, isLoading: isAuthLoading } = useAdminSession();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [pendingDeclineId, setPendingDeclineId] = useState<number | null>(null);
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  useEffect(() => {
    if (!isAuthLoading && admin === null) {
      router.push('/cms/login');
    }
  }, [admin, isAuthLoading, router]);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/applications');
        if (!response.ok) {
          setError('Failed to fetch applications');
          return;
        }

        const data = await response.json();
        setApplications(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getFilteredApplications = () => {
    return applications.filter((app) => {
      if (statusFilter && app.status !== statusFilter) return false;
      
      if (dateFromFilter) {
        const appDate = new Date(app.createdAt).toLocaleDateString('en-CA');
        if (appDate < dateFromFilter) return false;
      }
      
      if (dateToFilter) {
        const appDate = new Date(app.createdAt).toLocaleDateString('en-CA');
        if (appDate > dateToFilter) return false;
      }
      
      return true;
    });
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Approve this application?')) return;
    // TODO: Implement approve API endpoint
    setMessageDialog({
      open: true,
      title: 'Coming Soon',
      message: 'Approve functionality coming soon',
    });
  };

  const handleDeclineClick = (id: number) => {
    setPendingDeclineId(id);
    setDeclineReason('');
    setShowDeclineDialog(true);
  };

  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      setMessageDialog({
        open: true,
        title: 'Missing Information',
        message: 'Please select a reason for declining',
      });
      return;
    }

    try {
      const response = await fetch('/api/applications/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: pendingDeclineId,
          reason: declineReason,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessageDialog({
          open: true,
          title: 'Error',
          message: `Failed to decline application: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      // Refresh applications list
      const appResponse = await fetch('/api/applications');
      if (appResponse.ok) {
        const updatedApps = await appResponse.json();
        setApplications(updatedApps);
        setSelectedApplication(null);
      }

      setMessageDialog({
        open: true,
        title: 'Success',
        message: 'Application declined and email sent successfully',
      });
      setShowDeclineDialog(false);
      setDeclineReason('');
      setPendingDeclineId(null);
    } catch (error) {
      console.error('Error declining application:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to decline application',
      });
    }
  };

  if (isAuthLoading) {
    return null;
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[92rem] mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rental Applications</h1>
            <p className="text-sm text-gray-600 mt-1">Manage tenant rental applications</p>
          </div>
          <Link href="/cms" className="text-blue-600 hover:underline">
            ← Back to CMS
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No applications yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
            {/* Applications List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Applications ({getFilteredApplications().length})
                  </h2>
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setStatusFilter(null)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                          statusFilter === null
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        All
                      </button>
                      {['pending', 'approved', 'declined'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition capitalize ${
                            statusFilter === status
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Filter by Date</p>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dateFromFilter}
                          onChange={(e) => setDateFromFilter(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="From"
                        />
                        <input
                          type="date"
                          value={dateToFilter}
                          onChange={(e) => setDateToFilter(e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="To"
                        />
                        {(dateFromFilter || dateToFilter) && (
                          <button
                            onClick={() => {
                              setDateFromFilter('');
                              setDateToFilter('');
                            }}
                            className="px-2 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Applications List */}
                <div className="divide-y divide-gray-200 overflow-y-auto flex-1">
                  {getFilteredApplications().map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedApplication(app)}
                      className={`w-full text-left p-4 hover:bg-blue-50 transition ${
                        selectedApplication?.id === app.id ? 'bg-blue-100' : ''
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{app.applicantName}</p>
                      <p className="text-sm text-gray-600">{app.propertyName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                          {app.status && (
                            <Badge
                              className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${
                                app.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : app.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {app.status}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Details Panel */}
            <div className="lg:col-span-2">
              {selectedApplication ? (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                    {selectedApplication.status && (
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                          selectedApplication.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedApplication.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedApplication.status}
                      </span>
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
                      onClick={() => handleApprove(selectedApplication.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleDeclineClick(selectedApplication.id)}
                      variant="destructive"
                      className="flex-1"
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  Select an application to view details
                </div>
              )}
            </div>
          </div>
        )}

        {/* Decline Dialog */}
        <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Decline Application</DialogTitle>
              <DialogDescription>
                Please select a reason for declining this application.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-4">
              {[
                'Low household income',
                'Maxed out occupancy',
                'Pending approval for another applicant',
                'Other'
              ].map((reason) => (
                <label key={reason} className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="decline-reason"
                    value={reason}
                    checked={declineReason === reason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                  />
                  <span className="ml-3 text-sm text-gray-900">{reason}</span>
                </label>
              ))}
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setShowDeclineDialog(false);
                  setDeclineReason('');
                  setPendingDeclineId(null);
                }}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeclineSubmit}
                variant="destructive"
                disabled={!declineReason.trim()}
              >
                Decline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Message Dialog */}
        <Dialog open={messageDialog.open} onOpenChange={(open) => setMessageDialog({ ...messageDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{messageDialog.title}</DialogTitle>
            </DialogHeader>
            <p className="text-gray-700">{messageDialog.message}</p>
            <DialogFooter>
              <Button onClick={() => setMessageDialog({ ...messageDialog, open: false })}>
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
