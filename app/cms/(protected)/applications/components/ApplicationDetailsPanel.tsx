'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ApplicationStatus } from '@/lib/types';
import type { Application } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ApplicationDetailsPanelProps {
  selectedApplication: Application | null;
  onApplicationsChanged: () => Promise<boolean>;
}

function formatStatusLabel(status: string): string {
  if (status === ApplicationStatus.PENDING) return 'Pending';
  return status.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function ApplicationDetailsPanel({
  selectedApplication,
  onApplicationsChanged,
}: ApplicationDetailsPanelProps) {
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUndoDeleteDialog, setShowUndoDeleteDialog] = useState(false);
  const [showPendingDialog, setShowPendingDialog] = useState(false);
  const [pendingAdditionalInfo, setPendingAdditionalInfo] = useState('');
  const [selectedPendingNextSteps, setSelectedPendingNextSteps] = useState<number[]>([]);
  const [pendingNextStepDefaultContents] = useState<string[]>(() => {
    return [
      'Your application is under review. We will notify you once a decision has been made.',
      `Let's schedule a tour. Below are the available times. Please call or email us to confirm your preferred time slot.`,
      `Background checks are needed for all adults. Please complete the background checks and forward us the reports. If you have any questions, please contact us.`,
    ];
  });
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; title: string; message: string }>({
    open: false,
    title: '',
    message: '',
  });

  const approveApplication = async (id: number) => {
    try {
      const response = await fetch('/api/applications/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessageDialog({
          open: true,
          title: 'Error',
          message: `Failed to approve application: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      await onApplicationsChanged();
      setMessageDialog({
        open: true,
        title: 'Success',
        message: 'Application approved and email sent successfully',
      });
    } catch (error) {
      console.error('Error approving application:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to approve application',
      });
    }
  };

  const declineApplication = async (id: number, reason: string) => {
    try {
      const response = await fetch('/api/applications/decline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          reason,
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

      await onApplicationsChanged();
      setMessageDialog({
        open: true,
        title: 'Success',
        message: 'Application declined and email sent successfully',
      });
      setShowDeclineDialog(false);
      setDeclineReason('');
    } catch (error) {
      console.error('Error declining application:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to decline application',
      });
    }
  };

  const setApplicationStatus = async (
    id: number,
    status: ApplicationStatus.PENDING | ApplicationStatus.DELETED,
    additionalInfo?: string
  ) => {
    try {
      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          status,
          additionalInfo,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessageDialog({
          open: true,
          title: 'Error',
          message: `Failed to update status: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      await onApplicationsChanged();
      setMessageDialog({
        open: true,
        title: 'Success',
        message:
          status === ApplicationStatus.DELETED
            ? 'Application deleted successfully'
            : 'Application status updated to pending and email sent successfully',
      });
    } catch (error) {
      console.error('Error updating application status:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to update application status',
      });
    }
  };

  const undoDeleteApplication = async (id: number) => {
    try {
      const response = await fetch('/api/applications/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: id,
          status: ApplicationStatus.PENDING,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessageDialog({
          open: true,
          title: 'Error',
          message: `Failed to undo delete: ${error.error || 'Unknown error'}`,
        });
        return;
      }

      await onApplicationsChanged();
      setMessageDialog({
        open: true,
        title: 'Success',
        message: 'Application restored to pending successfully',
      });
    } catch (error) {
      console.error('Error undoing delete:', error);
      setMessageDialog({
        open: true,
        title: 'Error',
        message: 'Failed to undo delete',
      });
    }
  };

  const handleDeclineClick = () => {
    setDeclineReason('');
    setShowDeclineDialog(true);
  };

  const handleDeclineSubmit = async () => {
    if (!selectedApplication) return;
    if (!declineReason.trim()) {
      setMessageDialog({
        open: true,
        title: 'Missing Information',
        message: 'Please select a reason for declining',
      });
      return;
    }

    await declineApplication(selectedApplication.id, declineReason);
  };

  const handlePendingSubmit = async () => {
    if (!selectedApplication) return;
    if (!pendingAdditionalInfo.trim()) {
      setMessageDialog({
        open: true,
        title: 'Missing Information',
        message: 'Please enter additional information to send to the applicant.',
      });
      return;
    }

    setShowPendingDialog(false);
    await setApplicationStatus(selectedApplication.id, ApplicationStatus.PENDING, pendingAdditionalInfo);
    setPendingAdditionalInfo('');
  };

  const handlePendingNextStepToggle = (index: number) => {
    const selectedText = pendingNextStepDefaultContents[index];
    const isChecked = selectedPendingNextSteps.includes(index);

    if (isChecked) {
      setSelectedPendingNextSteps((prev) => prev.filter((value) => value !== index));
      setPendingAdditionalInfo((prev) =>
        prev
          .replace(selectedText, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
      );
      return;
    }

    setSelectedPendingNextSteps((prev) => [...prev, index]);
    setPendingAdditionalInfo((prev) => {
      if (!prev.trim()) return selectedText;
      if (prev.includes(selectedText)) return prev;
      return `${prev}\n\n${selectedText}`;
    });
  };

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
              selectedApplication.status === ApplicationStatus.PENDING
                ? 'bg-yellow-100 text-yellow-800'
                : selectedApplication.status === ApplicationStatus.APPROVED
                  ? 'bg-green-100 text-green-800'
                  : selectedApplication.status === ApplicationStatus.APPROVE_ARCHIVED
                    ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {formatStatusLabel(selectedApplication.status)}
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

      {selectedApplication.status === ApplicationStatus.DELETED ? (
        <div className="border-t pt-6">
          <Button onClick={() => setShowUndoDeleteDialog(true)} variant="outline" className="w-full">
            Undo Delete
          </Button>
        </div>
      ) : (
        <div className="border-t pt-6 grid grid-cols-2 gap-3">
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="secondary"
          >
            Delete
          </Button>
          <Button
            onClick={handleDeclineClick}
            variant="destructive"
          >
            Decline
          </Button>
          <Button
            onClick={() => {
              setPendingAdditionalInfo('');
              setSelectedPendingNextSteps([]);
              setShowPendingDialog(true);
            }}
            variant="outline"
          >
            Pending
          </Button>
          <Button
            onClick={() => setShowApproveDialog(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Approve
          </Button>
        </div>
      )}

      {/* Delete dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this application as deleted?<br/>No email will be sent.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                setShowDeleteDialog(false);
                await setApplicationStatus(selectedApplication.id, ApplicationStatus.DELETED);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo delete dialog */}
      <Dialog open={showUndoDeleteDialog} onOpenChange={setShowUndoDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undo Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this application to pending status?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUndoDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowUndoDeleteDialog(false);
                await undoDeleteApplication(selectedApplication.id);
              }}
            >
              Undo Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decline dialog */}
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
              'Other',
            ].map((reason) => (
                <label
                    key={reason}
                    className="flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                      type="radio"
                      name="decline-reason"
                      value={reason}
                      checked={declineReason === reason}
                      onChange={(event) => setDeclineReason(event.target.value)}
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
                }}
                variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleDeclineSubmit} variant="destructive" disabled={!declineReason.trim()}>
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending dialog */}
      <Dialog open={showPendingDialog} onOpenChange={setShowPendingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Pending Status</DialogTitle>
            <DialogDescription>
              Add additional information to send to the applicant before setting this application to pending.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Next Step Actions</p>
            {pendingNextStepDefaultContents.map((content, index) => (
              <label key={content} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedPendingNextSteps.includes(index)}
                  onChange={() => handlePendingNextStepToggle(index)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{content}</span>
              </label>
            ))}
          </div>

          <textarea
            value={pendingAdditionalInfo}
            onChange={(event) => setPendingAdditionalInfo(event.target.value)}
            rows={6}
            placeholder="Enter additional information for the applicant..."
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPendingDialog(false);
                setPendingAdditionalInfo('');
                setSelectedPendingNextSteps([]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handlePendingSubmit} disabled={!pendingAdditionalInfo.trim()}>
              Set Pending & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this application?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
                onClick={async () => {
                  setShowApproveDialog(false);
                  await approveApplication(selectedApplication.id);
                }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Message dialog */}
      <Dialog
        open={messageDialog.open}
        onOpenChange={(open) => setMessageDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{messageDialog.title}</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">{messageDialog.message}</p>
          <DialogFooter>
            <Button onClick={() => setMessageDialog((prev) => ({ ...prev, open: false }))}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
